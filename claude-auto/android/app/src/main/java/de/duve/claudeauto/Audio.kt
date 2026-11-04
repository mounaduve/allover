package de.duve.claudeauto

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.car.app.CarContext
import androidx.car.app.media.CarAudioRecord
import java.io.ByteArrayOutputStream
import java.util.Locale
import kotlin.math.sqrt

/**
 * Nimmt übers Automikrofon auf, bis "Fertig" gedrückt wird oder nach dem Sprechen
 * eine Pause kommt. Liefert 16-kHz-PCM (16 Bit, mono).
 */
class Recorder(private val carContext: CarContext, private val swapBytes: Boolean) {
    @Volatile private var stopRequested = false
    private var focus: AudioFocusRequest? = null

    fun stop() { stopRequested = true }

    /** Blockiert; im Hintergrund-Thread aufrufen. null = kein Audiofokus. */
    fun record(): ByteArray? {
        val audio = carContext.getSystemService(AudioManager::class.java) ?: return null
        val rec = CarAudioRecord.create(carContext)
        val attrs = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .setUsage(AudioAttributes.USAGE_ASSISTANT)
            .build()
        val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(attrs)
            .setOnAudioFocusChangeListener { if (it == AudioManager.AUDIOFOCUS_LOSS) stopRequested = true }
            .build()
        if (audio.requestAudioFocus(req) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) return null
        focus = req
        val out = ByteArrayOutputStream()
        try {
            rec.startRecording()
            val buf = ByteArray(CarAudioRecord.AUDIO_CONTENT_BUFFER_SIZE)
            val bytesPerSecond = CarAudioRecord.AUDIO_CONTENT_SAMPLING_RATE * 2
            var heardSpeech = false
            var silentBytes = 0
            while (!stopRequested) {
                val n = rec.read(buf, 0, buf.size)
                if (n < 0) break
                if (n == 0) continue
                if (swapBytes) for (i in 0 until n - 1 step 2) { val t = buf[i]; buf[i] = buf[i + 1]; buf[i + 1] = t }
                out.write(buf, 0, n)
                val loud = rms(buf, n) > SPEECH_RMS
                if (loud) { heardSpeech = true; silentBytes = 0 } else silentBytes += n
                val total = out.size()
                if (heardSpeech && silentBytes > bytesPerSecond * PAUSE_SECONDS) break
                if (!heardSpeech && total > bytesPerSecond * NO_SPEECH_SECONDS) break
                if (total > bytesPerSecond * MAX_SECONDS) break
            }
        } finally {
            runCatching { rec.stopRecording() }
            audio.abandonAudioFocusRequest(req)
            focus = null
        }
        return out.toByteArray()
    }

    companion object {
        const val SPEECH_RMS = 700.0
        const val PAUSE_SECONDS = 2.0
        const val NO_SPEECH_SECONDS = 10
        const val MAX_SECONDS = 120
    }
}

/**
 * Nimmt über das Handy auf – im Auto bevorzugt über das Automikrofon der Bluetooth-Freisprechverbindung.
 * Läuft in der Musik-App, die als Vordergrunddienst mit Mikrofon-Typ gestartet ist.
 */
class PhoneRecorder(private val context: Context, private val swapBytes: Boolean, private val stopOnPause: Boolean = true) {
    @Volatile private var stopRequested = false
    /** Welches Mikrofon zuletzt benutzt wurde, fürs Fehlerprotokoll. */
    var micName = "Handy"; private set

    fun stop() { stopRequested = true }

    fun record(): ByteArray {
        val audio = context.getSystemService(AudioManager::class.java)
        val sco = audio.availableCommunicationDevices.firstOrNull { it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO }
        val useSco = sco != null && Hub.prefs.carMic && audio.setCommunicationDevice(sco)
        micName = if (useSco) "Auto (Bluetooth: ${sco?.productName})" else "Handy"
        val min = AudioRecord.getMinBufferSize(RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        val rec = AudioRecord(MediaRecorder.AudioSource.VOICE_COMMUNICATION, RATE,
            AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, maxOf(min, 3200) * 4)
        val out = ByteArrayOutputStream()
        try {
            if (useSco) Thread.sleep(600) // Freisprechverbindung braucht einen Moment
            rec.startRecording()
            val buf = ByteArray(3200) // 100 ms
            val bytesPerSecond = RATE * 2
            var heardSpeech = false
            var silentBytes = 0
            while (!stopRequested) {
                val n = rec.read(buf, 0, buf.size)
                if (n < 0) break
                if (n == 0) continue
                if (swapBytes) for (i in 0 until n - 1 step 2) { val t = buf[i]; buf[i] = buf[i + 1]; buf[i + 1] = t }
                out.write(buf, 0, n)
                if (rms(buf, n) > Recorder.SPEECH_RMS) { heardSpeech = true; silentBytes = 0 } else silentBytes += n
                val total = out.size()
                if (stopOnPause && heardSpeech && silentBytes > bytesPerSecond * Recorder.PAUSE_SECONDS) break
                if (!heardSpeech && total > bytesPerSecond * Recorder.NO_SPEECH_SECONDS) break
                if (total > bytesPerSecond * Recorder.MAX_SECONDS) break
            }
        } finally {
            runCatching { rec.stop() }
            rec.release()
            if (useSco) audio.clearCommunicationDevice()
        }
        return out.toByteArray()
    }

    companion object { const val RATE = 16000 }
}

internal fun rms(b: ByteArray, n: Int): Double {
    var sum = 0.0
    var count = 0
    var i = 0
    while (i + 1 < n) {
        val s = ((b[i + 1].toInt() shl 8) or (b[i].toInt() and 0xff)).toShort().toDouble()
        sum += s * s; count++; i += 2
    }
    return if (count == 0) 0.0 else sqrt(sum / count)
}

/**
 * Vorlesen als Medienton (läuft so über Android Auto).
 * Natürliche Stimme über ElevenLabs, wenn eingeschaltet; sonst die beste deutsche Stimme des Handys.
 */
class Speaker(private val context: Context) {
    private val audio = context.getSystemService(AudioManager::class.java)
    private val attrs = AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .build()
    private val focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
        .setAudioAttributes(attrs).build()
    private var ready = false
    private val pending = mutableListOf<Pair<String, (() -> Unit)?>>()
    private val callbacks = java.util.concurrent.ConcurrentHashMap<String, () -> Unit>()
    @Volatile var speaking = false; private set
    @Volatile private var generation = 0
    private val elevenLock = Object()
    @Volatile private var player: MediaPlayer? = null

    // Google-Sprachausgabe bevorzugen, falls installiert – klingt deutlich besser als Samsungs
    private val tts: TextToSpeech = TextToSpeech(context.applicationContext, { st ->
        if (st == TextToSpeech.SUCCESS) {
            tts.language = Locale.GERMANY
            applyVoice()
            tts.setAudioAttributes(attrs)
            ready = true
            pending.toList().forEach { (t, cb) -> speak(t, cb) }
            pending.clear()
        }
    }, if (isInstalled(context, GOOGLE_TTS)) GOOGLE_TTS else null)

    /** Alle deutschen Stimmen der Sprachausgabe, beste zuerst. */
    fun germanVoices(): List<android.speech.tts.Voice> =
        (if (ready) tts.voices else null).orEmpty()
            .filter { it.locale.language == "de" }
            .sortedWith(compareBy({ it.features.contains("notInstalled") }, { -it.quality }, { it.name }))

    /** Engine-Name, damit Mouna sieht, ob Google oder Samsung spricht. */
    fun engineName(): String = if (ready) tts.defaultEngine ?: "?" else "lädt …"

    private fun applyVoice() {
        val voices = tts.voices?.filter { it.locale.language == "de" }.orEmpty()
        val chosen = voices.firstOrNull { it.name == Hub.prefs.androidVoice }
            ?: voices.filter { !it.features.contains("notInstalled") }.maxByOrNull { it.quality * 10 - it.latency }
        chosen?.let { tts.voice = it }
    }

    init {
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) { speaking = true; Hub.changed() }
            override fun onDone(id: String?) { finished(id) }
            @Deprecated("alt") override fun onError(id: String?) { finished(id) }
            override fun onStop(id: String?, interrupted: Boolean) { finished(id) }
        })
    }

    private fun finished(id: String?) {
        if (!tts.isSpeaking) {
            speaking = false
            audio?.abandonAudioFocusRequest(focus)
            Hub.changed()
        }
        id?.let { callbacks.remove(it)?.invoke() }
    }

    /** Liest vor; `onDone` läuft, wenn der letzte Teil fertig gesprochen ist. */
    fun speak(raw: String, onDone: (() -> Unit)? = null) {
        val text = cleanForSpeech(raw)
        if (Hub.prefs.naturalVoice && Hub.prefs.elevenKey.isNotBlank()) speakEleven(text, onDone)
        else speakAndroid(text, onDone)
    }

    private fun speakAndroid(text: String, onDone: (() -> Unit)?) {
        if (!ready) { pending += text to onDone; return }
        tts.setSpeechRate(Hub.prefs.speechRate)
        if (tts.voice?.name != Hub.prefs.androidVoice && Hub.prefs.androidVoice.isNotBlank()) applyVoice()
        audio?.requestAudioFocus(focus)
        val parts = text.chunked(3500).ifEmpty { listOf(" ") }
        parts.forEachIndexed { i, part ->
            val id = "u${System.nanoTime()}_$i"
            if (i == parts.lastIndex && onDone != null) callbacks[id] = onDone
            tts.speak(part, TextToSpeech.QUEUE_ADD, null, id)
        }
    }

    /** ElevenLabs: Teile nacheinander holen und abspielen. Bei Fehlern übernimmt die Handy-Stimme. */
    private fun speakEleven(text: String, onDone: (() -> Unit)?) {
        val gen = generation
        Hub.io.execute {
            synchronized(elevenLock) {
                if (gen != generation) return@execute
                speaking = true; Hub.changed()
                audio?.requestAudioFocus(focus)
                try {
                    for (part in splitSentences(text, 1500)) {
                        if (gen != generation) return@execute
                        val mp3 = try { fetchEleven(part) } catch (e: Exception) {
                            Hub.log("ElevenLabs-Stimme fehlgeschlagen: ${e.message}")
                            null
                        }
                        if (mp3 == null) { speakAndroid(part, null); continue }
                        if (gen != generation) return@execute
                        play(mp3)
                    }
                } finally {
                    if (gen == generation) {
                        speaking = false
                        audio?.abandonAudioFocusRequest(focus)
                        Hub.changed()
                        onDone?.invoke()
                    }
                }
            }
        }
    }

    private fun fetchEleven(text: String): java.io.File {
        val voice = Hub.prefs.elevenVoice
        val body = org.json.JSONObject()
            .put("text", text)
            .put("model_id", "eleven_flash_v2_5")
            .put("language_code", "de")
            .put("voice_settings", org.json.JSONObject().put("speed", Hub.prefs.speechRate.coerceIn(0.7f, 1.2f).toDouble()))
            .toString().toByteArray()
        val c = java.net.URL("https://api.elevenlabs.io/v1/text-to-speech/$voice?output_format=mp3_44100_64")
            .openConnection() as java.net.HttpURLConnection
        c.requestMethod = "POST"; c.connectTimeout = 10_000; c.readTimeout = 30_000; c.doOutput = true
        c.setRequestProperty("xi-api-key", Hub.prefs.elevenKey)
        c.setRequestProperty("Content-Type", "application/json")
        c.setRequestProperty("Accept", "audio/mpeg")
        c.outputStream.use { it.write(body) }
        if (c.responseCode != 200) {
            val err = c.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
            throw HttpException(c.responseCode, "${c.responseCode} ${err.take(200)}")
        }
        val f = java.io.File.createTempFile("tts", ".mp3", context.cacheDir)
        c.inputStream.use { inp -> f.outputStream().use { inp.copyTo(it) } }
        return f
    }

    /** Spielt eine Datei ab und wartet, bis sie fertig ist (oder gestoppt wurde). */
    private fun play(f: java.io.File) {
        val done = java.util.concurrent.CountDownLatch(1)
        val mp = MediaPlayer().apply {
            setAudioAttributes(attrs)
            setDataSource(f.path)
            setOnCompletionListener { done.countDown() }
            setOnErrorListener { _, _, _ -> done.countDown(); true }
            prepare()
        }
        player = mp
        mp.start()
        done.await(5, java.util.concurrent.TimeUnit.MINUTES)
        player = null
        runCatching { mp.release() }
        f.delete()
    }

    fun stop() {
        generation++
        callbacks.clear(); tts.stop()
        player?.let { p -> runCatching { p.stop() }; runCatching { p.release() } }
        player = null
        speaking = false; audio?.abandonAudioFocusRequest(focus); Hub.changed()
    }

    companion object {
        /** Gleiche Aufbereitung wie im Telegram-Vorlese-Hook: Code, Links und Markdown raus. */
        fun cleanForSpeech(t: String): String = t
            // Zitierte Frage am Antwortanfang („> Aus dem Auto: …“) nicht nochmal vorlesen
            .replace(Regex("(?m)^>\\s*Aus dem Auto:.*$"), "")
            .replace(Regex("```.*?```", RegexOption.DOT_MATCHES_ALL), " Codeblock übersprungen. ")
            .replace(Regex("`([^`]*)`"), "$1")
            .replace(Regex("!?\\[([^\\]]*)\\]\\([^)]*\\)"), "$1")
            .replace(Regex("https?://\\S+"), " Link ")
            .replace(Regex("(?m)^\\s*\\|.*\\|\\s*$"), "")
            .replace(Regex("[*_#>]+"), "")
            .replace(Regex("(?m)^\\s*[-•]\\s*"), "")
            .replace(Regex("\\n{2,}"), ". ")
            .replace(Regex("[ \\t]{2,}"), " ")
            .trim()

        const val GOOGLE_TTS = "com.google.android.tts"

        fun isInstalled(c: Context, pkg: String) =
            runCatching { c.packageManager.getPackageInfo(pkg, 0) }.isSuccess

        /** Teilt an Satzenden, damit die Stimme nicht mitten im Satz neu ansetzt. */
        fun splitSentences(t: String, max: Int): List<String> {
            val out = mutableListOf<String>()
            val cur = StringBuilder()
            for (s in t.split(Regex("(?<=[.!?])\\s+"))) {
                if (cur.isNotEmpty() && cur.length + s.length > max) { out += cur.toString(); cur.clear() }
                if (cur.isNotEmpty()) cur.append(' ')
                cur.append(s)
            }
            if (cur.isNotBlank()) out += cur.toString()
            return out.flatMap { it.chunked(max) }
        }
    }
}

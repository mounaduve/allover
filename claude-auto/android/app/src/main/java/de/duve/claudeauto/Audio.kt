package de.duve.claudeauto

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
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

    private fun rms(b: ByteArray, n: Int): Double {
        var sum = 0.0
        var count = 0
        var i = 0
        while (i + 1 < n) {
            val s = ((b[i + 1].toInt() shl 8) or (b[i].toInt() and 0xff)).toShort().toDouble()
            sum += s * s; count++; i += 2
        }
        return if (count == 0) 0.0 else sqrt(sum / count)
    }

    companion object {
        const val SPEECH_RMS = 700.0
        const val PAUSE_SECONDS = 2.0
        const val NO_SPEECH_SECONDS = 10
        const val MAX_SECONDS = 120
    }
}

/** Vorlesen mit der deutschen Sprachausgabe des Handys. */
class Speaker(context: Context) {
    private val audio = context.getSystemService(AudioManager::class.java)
    private val attrs = AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .setUsage(AudioAttributes.USAGE_ASSISTANT)
        .build()
    private val focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
        .setAudioAttributes(attrs).build()
    private var ready = false
    private val pending = mutableListOf<String>()
    private val tts: TextToSpeech = TextToSpeech(context.applicationContext) { st ->
        if (st == TextToSpeech.SUCCESS) {
            tts.language = Locale.GERMANY
            tts.setAudioAttributes(attrs)
            ready = true
            pending.toList().forEach { speak(it) }
            pending.clear()
        }
    }

    init {
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) { if (!tts.isSpeaking) audio?.abandonAudioFocusRequest(focus) }
            @Deprecated("alt") override fun onError(id: String?) { audio?.abandonAudioFocusRequest(focus) }
        })
    }

    fun speak(raw: String) {
        if (!ready) { pending += raw; return }
        audio?.requestAudioFocus(focus)
        cleanForSpeech(raw).chunked(3500).forEachIndexed { i, part ->
            tts.speak(part, TextToSpeech.QUEUE_ADD, null, "u${System.nanoTime()}_$i")
        }
    }

    fun stop() { tts.stop(); audio?.abandonAudioFocusRequest(focus) }

    companion object {
        /** Gleiche Aufbereitung wie im Telegram-Vorlese-Hook: Code, Links und Markdown raus. */
        fun cleanForSpeech(t: String): String = t
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
    }
}

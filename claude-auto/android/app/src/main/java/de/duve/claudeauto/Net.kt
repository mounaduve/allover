package de.duve.claudeauto

import android.content.Context
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/** Einstellungen am Handy: Relay-Adresse, Geräteschlüssel, ElevenLabs-Schlüssel. */
class Prefs(context: Context) {
    private val p = context.getSharedPreferences("claude_auto", Context.MODE_PRIVATE)

    var relayUrl: String
        get() = p.getString("relay", DEFAULT_RELAY)!!.trimEnd('/')
        set(v) = p.edit().putString("relay", v.trim()).apply()
    var deviceToken: String
        get() = p.getString("device_token", "")!!
        set(v) = p.edit().putString("device_token", v).apply()
    var elevenKey: String
        get() = p.getString("eleven_key", "")!!
        set(v) = p.edit().putString("eleven_key", v.trim()).apply()
    /** Falls die Erkennung nur Unsinn liefert: Byte-Reihenfolge der Aufnahme tauschen. */
    /** Höchste gehörte oder angezeigte Antwort je Sitzung, für „neue Antwort“ in der Liste. -1 = Sitzung noch nie gesehen. */
    fun heardReply(sessionId: String): Long = p.getLong("heard_$sessionId", -1)
    fun setHeardReply(sessionId: String, replyId: Long) = p.edit().putLong("heard_$sessionId", replyId).apply()
    /** Mouna hat dieser Sitzung über die App geschrieben und die Antwort noch nicht gehört. */
    fun askedViaApp(sessionId: String) = p.getBoolean("asked_$sessionId", false)
    fun setAskedViaApp(sessionId: String, v: Boolean) = p.edit().putBoolean("asked_$sessionId", v).apply()

    /** Stacktrace des letzten Absturzes, wird beim nächsten Start gemeldet. */
    var lastCrash: String
        get() = p.getString("last_crash", "")!!
        set(v) = p.edit().putString("last_crash", v).apply()
    /** Synchron schreiben – der Prozess endet direkt danach. */
    fun saveCrash(v: String) { p.edit().putString("last_crash", v).commit() }

    var swapBytes: Boolean
        get() = p.getBoolean("swap_bytes", false)
        set(v) = p.edit().putBoolean("swap_bytes", v).apply()

    /** Im Auto das Automikrofon über die Bluetooth-Freisprechverbindung nutzen. */
    var carMic: Boolean
        get() = p.getBoolean("car_mic", true)
        set(v) = p.edit().putBoolean("car_mic", v).apply()

    /** Natürliche Stimme über ElevenLabs (verbraucht Credits), sonst Handy-Stimme. */
    var naturalVoice: Boolean
        get() = p.getBoolean("natural_voice", false)
        set(v) = p.edit().putBoolean("natural_voice", v).apply()
    var elevenVoice: String
        get() = p.getString("eleven_voice", DEFAULT_VOICE)!!.ifBlank { DEFAULT_VOICE }
        set(v) = p.edit().putString("eleven_voice", v.trim()).apply()
    /** Gewählte Handy-Stimme (Name aus der Google-Sprachausgabe), leer = beste verfügbare. */
    var androidVoice: String
        get() = p.getString("android_voice", "")!!
        set(v) = p.edit().putString("android_voice", v).apply()
    /** Sprechtempo, 1.0 = normal. */
    var speechRate: Float
        get() = p.getFloat("speech_rate", 1.15f)
        set(v) = p.edit().putFloat("speech_rate", v.coerceIn(0.5f, 2.5f)).apply()

    /** Gespräch am Handy: Aufnahme endet von selbst nach einer Sprechpause (sonst per Tipp). */
    var autoSend: Boolean
        get() = p.getBoolean("auto_send", true)
        set(v) = p.edit().putBoolean("auto_send", v).apply()
    /** Gespräch am Handy: nach der vorgelesenen Antwort von selbst wieder zuhören. */
    var autoListen: Boolean
        get() = p.getBoolean("auto_listen", true)
        set(v) = p.edit().putBoolean("auto_listen", v).apply()
    /** So viele Sekunden Stille beenden das Gespräch. */
    var silenceSeconds: Int
        get() = p.getInt("silence_seconds_v2", 5)
        set(v) = p.edit().putInt("silence_seconds_v2", v).apply()
    /** So viele Sekunden Sprechpause schicken die Nachricht ab. */
    var sendPauseSeconds: Int
        get() = p.getInt("send_pause_seconds", 2)
        set(v) = p.edit().putInt("send_pause_seconds", v).apply()
    /** Spracherkennung: "google" (kostenlos, auf dem Handy), "mac" (Whisper auf dem Mac) oder "eleven" (ElevenLabs Scribe, verbraucht Credits). */
    var sttEngine: String
        get() = p.getString("stt_engine", "google")!!
        set(v) = p.edit().putString("stt_engine", v).apply()
    /** Zuletzt im Gespräch gewählte Sitzung. */
    var talkSession: String
        get() = p.getString("talk_session", "")!!
        set(v) = p.edit().putString("talk_session", v).apply()

    companion object {
        const val DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"
        const val DEFAULT_RELAY = "https://molli-server.tail4e4456.ts.net/auto"
    }
}

class HttpException(val code: Int, message: String) : Exception(message)

data class Http(val code: Int, val body: String, val header: (String) -> String? = { null })

fun http(
    url: String,
    method: String = "GET",
    headers: Map<String, String> = emptyMap(),
    body: ByteArray? = null,
    timeoutMs: Int = 20_000,
): Http {
    val c = URL(url).openConnection() as HttpURLConnection
    c.requestMethod = method
    c.connectTimeout = 10_000
    c.readTimeout = timeoutMs
    headers.forEach { (k, v) -> c.setRequestProperty(k, v) }
    if (body != null) {
        c.doOutput = true
        c.outputStream.use { it.write(body) }
    }
    val code = c.responseCode
    val stream = if (code >= 400) c.errorStream else c.inputStream
    val text = stream?.bufferedReader()?.use { it.readText() } ?: ""
    val fields = c.headerFields.filterKeys { it != null }.mapKeys { it.key.lowercase() }
    c.disconnect()
    return Http(code, text) { name -> fields[name.lowercase()]?.firstOrNull() }
}

data class ChatSession(val id: String, val name: String, val busy: Boolean, val lastReplyId: Long)
data class Status(val macOnline: Boolean, val sessions: List<ChatSession>)
data class Reply(val id: Long, val text: String)

/** Gespräch mit dem Relay auf der NAS. */
class Relay(private val prefs: Prefs) {
    private fun auth() = mapOf("Authorization" to "Bearer ${prefs.deviceToken}")
    private val json = mapOf("Content-Type" to "application/json")

    fun status(): Status {
        val r = http("${prefs.relayUrl}/api/status", headers = auth())
        if (r.code != 200) throw HttpException(r.code, r.body)
        val o = JSONObject(r.body)
        val arr = o.getJSONArray("sessions")
        val list = (0 until arr.length()).map {
            val s = arr.getJSONObject(it)
            ChatSession(s.getString("id"), s.getString("name"), s.getBoolean("busy"), s.getLong("last_reply_id"))
        }
        return Status(o.getBoolean("mac_online"), list)
    }

    fun send(sessionId: String, text: String) {
        val b = JSONObject().put("session_id", sessionId).put("text", text).toString().toByteArray()
        val r = http("${prefs.relayUrl}/api/messages", "POST", auth() + json, b)
        if (r.code != 200) throw HttpException(r.code, r.body)
    }

    /** Wartet bis zu 25 s auf eine neue Antwort; null, wenn noch keine da ist. */
    fun waitReply(sessionId: String, after: Long, wait: Int = 25): Reply? {
        val sid = URLEncoder.encode(sessionId, "UTF-8")
        val r = http("${prefs.relayUrl}/api/replies?session_id=$sid&after=$after&wait=$wait", headers = auth(), timeoutMs = 40_000)
        if (r.code == 204) return null
        if (r.code != 200) throw HttpException(r.code, r.body)
        val o = JSONObject(r.body)
        return Reply(o.getLong("id"), o.getString("text"))
    }

    /** Fehlerprotokoll ans Relay, damit Claude auf dem Mac Probleme im Auto sehen kann. */
    fun log(lines: List<String>) {
        val b = JSONObject().put("lines", org.json.JSONArray(lines)).toString().toByteArray()
        http("${prefs.relayUrl}/api/log", "POST", auth() + json, b)
    }

    // ---- Spracherkennung auf dem Mac (Whisper) ----

    /** Neuer Erkennungsauftrag; liefert Nummer und ob der Mac gerade erreichbar ist. */
    fun sttCreate(): Pair<Long, Boolean> {
        val r = http("${prefs.relayUrl}/api/stt", "POST", auth())
        if (r.code != 200) throw HttpException(r.code, "Mac-Erkennung anlegen: ${r.code}")
        val o = JSONObject(r.body)
        return o.getLong("id") to o.getBoolean("mac_online")
    }

    fun sttPart(job: Long, seq: Int, pcm: ByteArray) {
        val r = http("${prefs.relayUrl}/api/stt/$job/part?seq=$seq", "POST",
            auth() + mapOf("Content-Type" to "application/octet-stream"), pcm, timeoutMs = 30_000)
        if (r.code != 200) throw HttpException(r.code, "Mac-Erkennung Teil $seq: ${r.code}")
    }

    fun sttDone(job: Long, parts: Int) {
        val r = http("${prefs.relayUrl}/api/stt/$job/done?parts=$parts", "POST", auth())
        if (r.code != 200) throw HttpException(r.code, "Mac-Erkennung abschließen: ${r.code}")
    }

    /** Text (oder Fehler) des Auftrags; null, solange er nicht fertig ist. `taken`: Mac arbeitet schon daran. */
    data class SttPoll(val text: String?, val error: String?, val taken: Boolean)

    fun sttResult(job: Long, wait: Int): SttPoll {
        val r = http("${prefs.relayUrl}/api/stt/$job?wait=$wait", headers = auth(), timeoutMs = 40_000)
        if (r.code == 204) return SttPoll(null, null, r.header("X-Taken") == "1")
        if (r.code != 200) throw HttpException(r.code, "Mac-Erkennung Ergebnis: ${r.code}")
        val o = JSONObject(r.body)
        return SttPoll(o.optString("text").takeIf { !o.isNull("text") }, o.optString("error").takeIf { !o.isNull("error") }, true)
    }

    fun pairStart(name: String): Pair<String, String> {
        val b = JSONObject().put("name", name).toString().toByteArray()
        val r = http("${prefs.relayUrl}/api/pair/start", "POST", json, b)
        if (r.code != 200) throw HttpException(r.code, r.body)
        val o = JSONObject(r.body)
        return o.getString("code") to o.getString("secret")
    }

    /** Liefert den Geräteschlüssel, sobald der Mac die Kopplung freigegeben hat. */
    fun pairStatus(secret: String): String? {
        val r = http("${prefs.relayUrl}/api/pair/status?secret=${URLEncoder.encode(secret, "UTF-8")}")
        if (r.code != 200) throw HttpException(r.code, r.body)
        val o = JSONObject(r.body)
        return if (o.getBoolean("approved")) o.getString("token") else null
    }
}

data class ElevenVoice(val id: String, val name: String, val category: String, val info: String)

/** Stimmen des ElevenLabs-Kontos; „premade“ (Standardstimmen) zuerst. */
fun loadElevenVoices(key: String): List<ElevenVoice> {
    val r = http("https://api.elevenlabs.io/v1/voices", headers = mapOf("xi-api-key" to key))
    if (r.code != 200) throw HttpException(r.code, "Stimmen laden: ${r.code} ${r.body.take(150)}")
    val arr = JSONObject(r.body).getJSONArray("voices")
    return (0 until arr.length()).map { i ->
        val v = arr.getJSONObject(i)
        val l = v.optJSONObject("labels")
        val info = listOfNotNull(l?.optString("gender")?.takeIf { it.isNotBlank() }, l?.optString("accent")?.takeIf { it.isNotBlank() })
            .joinToString(", ")
        ElevenVoice(v.getString("voice_id"), v.optString("name"), v.optString("category"), info)
    }.sortedWith(compareBy({ it.category != "premade" }, { it.name }))
}

/** Spracherkennung über ElevenLabs Scribe. Die Aufnahme geht direkt vom Handy dorthin. */
class Stt(private val prefs: Prefs, context: android.content.Context) {
    companion object {
        /** 5 Sekunden Audio (16 kHz, 16 Bit) je hochgeladenem Teil. */
        const val PART_BYTES = 5 * 32_000
    }

    private val google = GoogleStt(context.applicationContext)

    /** Google (kostenlos) oder ElevenLabs, je nach Einstellung. */
    fun transcribe(pcm16k: ByteArray): String =
        if (prefs.sttEngine == "eleven") eleven(pcm16k)
        // Google lehnt lange Aufnahmen ab (Fehler 2 ab etwa 10 Sekunden) – darum in Stücke an leisen Stellen teilen
        else google(pcm16k)

    private val liveExec = java.util.concurrent.Executors.newSingleThreadExecutor()

    /**
     * Erkennung schon während der Aufnahme: Jedes fertige Stück (≤ 8 s, an einer leisen Stelle geschnitten)
     * geht sofort an Google, sodass nach dem Sprechen nur noch das letzte Stück fehlt.
     * Mit ElevenLabs wird wie bisher erst am Ende alles auf einmal erkannt.
     */
    fun live() = Live()

    inner class Live {
        private val useEleven = prefs.sttEngine == "eleven"
        private val buf = java.io.ByteArrayOutputStream()
        private val parts = mutableListOf<java.util.concurrent.Future<Result<String>>>()
        @Volatile private var cancelled = false
        private val mac = if (prefs.sttEngine == "mac") MacUpload() else null

        /** Vom Aufnahme-Thread mit jedem neuen Audioblock aufgerufen. */
        fun feed(b: ByteArray, n: Int) {
            mac?.feed(b, n)
            buf.write(b, 0, n)
            if (useEleven || buf.size() <= GoogleStt.MAX_CHUNK) return
            val all = buf.toByteArray()
            val cut = GoogleStt.cutPoint(all)
            submit(all.copyOfRange(0, cut))
            buf.reset(); buf.write(all, cut, all.size - cut)
        }

        private fun submit(chunk: ByteArray) {
            val i = parts.size + 1
            parts += liveExec.submit<Result<String>> {
                if (cancelled) Result.success("") else runCatching { googleChunk(chunk) }
                    .onFailure { Hub.log("Google-Erkennung Stück $i übersprungen: ${it.message}") }
            }
        }

        /** Nach dem Ende der Aufnahme: Rest erkennen und alles zusammensetzen. Blockiert. */
        fun finish(): String {
            if (useEleven) return eleven(buf.toByteArray())
            if (buf.size() > 0) submit(buf.toByteArray())
            // Whisper auf dem Mac zuerst; Google läuft nebenher und springt ein, wenn der Mac nicht liefert
            mac?.finish()?.let { return it }
            val results = parts.map { it.get() }
            val text = results.mapNotNull { it.getOrNull() }.filter { it.isNotBlank() }.joinToString(" ").trim()
            if (text.isBlank()) results.firstNotNullOfOrNull { it.exceptionOrNull() }?.let { throw it }
            return text
        }

        /** Aufnahme verworfen: noch nicht begonnene Stücke gar nicht erst erkennen. */
        fun cancel() { cancelled = true; mac?.failed = true }
    }

    /**
     * Lädt die Aufnahme schon während des Sprechens in Teilen (je 5 s) übers Relay zum Mac hoch,
     * damit am Ende nur noch der letzte Teil fehlt. Jeder Fehler schaltet still auf Google zurück.
     */
    private inner class MacUpload {
        private val exec = java.util.concurrent.Executors.newSingleThreadExecutor()
        private val pending = java.io.ByteArrayOutputStream()
        private var seq = 0
        private var job = 0L
        @Volatile var failed = false

        init {
            exec.execute {
                runCatching { Hub.relay.sttCreate() }
                    .onSuccess { (id, online) ->
                        job = id
                        if (!online) fail("Mac nicht erreichbar")
                    }
                    .onFailure { fail(it.message) }
            }
        }

        private fun fail(why: String?) {
            if (!failed) Hub.log("Mac-Erkennung aus, nehme Google: $why")
            failed = true
        }

        fun feed(b: ByteArray, n: Int) {
            if (failed) return
            pending.write(b, 0, n)
            if (pending.size() >= PART_BYTES) flush()
        }

        private fun flush() {
            val data = pending.toByteArray(); pending.reset()
            val s = seq++
            exec.execute {
                if (failed) return@execute
                for (attempt in 1..3) {
                    val r = runCatching { Hub.relay.sttPart(job, s, data) }
                    if (r.isSuccess) return@execute
                    if (attempt == 3) fail(r.exceptionOrNull()?.message) else Thread.sleep(500)
                }
            }
        }

        /** Text vom Mac oder null (dann Google). Blockiert höchstens etwa zwei Minuten. */
        fun finish(): String? {
            if (failed) return null
            if (pending.size() > 0) flush()
            val done = exec.submit<Unit> { if (!failed) runCatching { Hub.relay.sttDone(job, seq) }.onFailure { fail(it.message) } }
            runCatching { done.get(60, java.util.concurrent.TimeUnit.SECONDS) }.onFailure { fail("Hochladen zu langsam") }
            exec.shutdown()
            if (failed) return null
            val start = System.currentTimeMillis()
            while (!failed) {
                val polled = runCatching { Hub.relay.sttResult(job, 10) }
                val r = polled.getOrNull()
                if (r == null) { fail(polled.exceptionOrNull()?.message); break }
                r.text?.let { t ->
                    if (t.isBlank()) { fail("Mac hat nichts erkannt"); return null }
                    Hub.log("Mac-Erkennung: ${seq} Teile, ${(System.currentTimeMillis() - start) / 1000} s gewartet")
                    return t.trim()
                }
                r.error?.let { fail(it); return null }
                val waited = System.currentTimeMillis() - start
                // Der Mac holt fertige Aufträge sofort ab; tut er das nicht, schläft er oder der Dienst läuft nicht
                if (!r.taken && waited > 12_000) fail("Mac holt nicht ab")
                if (waited > 120_000) fail("Mac zu langsam")
            }
            return null
        }
    }

    /** Stückweise erkennen; ein misslungenes Stück kostet nur dieses Stück, nicht die ganze Nachricht. */
    private fun google(pcm16k: ByteArray): String {
        val chunks = GoogleStt.split(pcm16k)
        var lastError: Throwable? = null
        val text = chunks.mapIndexed { i, c ->
            runCatching { googleChunk(c) }.getOrElse {
                lastError = it
                Hub.log("Google-Erkennung Stück ${i + 1}/${chunks.size} übersprungen: ${it.message}")
                ""
            }
        }.filter { it.isNotBlank() }.joinToString(" ").trim()
        if (text.isBlank()) lastError?.let { throw it }
        return text
    }

    /** Ein Stück erkennen; bis zu drei Versuche, der letzte bevorzugt auf dem Gerät. */
    private fun googleChunk(pcm: ByteArray): String {
        var last: Throwable? = null
        for (attempt in 1..3) {
            if (attempt > 1) Thread.sleep(400)
            val r = runCatching { google.transcribe(pcm, offline = attempt == 3) }
            r.getOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
            last = r.exceptionOrNull()
            Hub.log("Google-Erkennung Versuch $attempt ${last?.message ?: "leer"}")
        }
        last?.let { throw it }
        return ""
    }

    private fun eleven(pcm16k: ByteArray): String {
        if (prefs.elevenKey.isBlank()) throw HttpException(0, "ElevenLabs-Schlüssel fehlt (am Handy eintragen)")
        val boundary = "----claudeauto${System.currentTimeMillis()}"
        val out = ByteArrayOutputStream()
        fun field(name: String, value: String) {
            out.write("--$boundary\r\nContent-Disposition: form-data; name=\"$name\"\r\n\r\n$value\r\n".toByteArray())
        }
        field("model_id", "scribe_v2")
        field("language_code", "deu")
        field("file_format", "pcm_s16le_16")
        field("tag_audio_events", "false")
        out.write("--$boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.pcm\"\r\nContent-Type: application/octet-stream\r\n\r\n".toByteArray())
        out.write(pcm16k)
        out.write("\r\n--$boundary--\r\n".toByteArray())
        val r = http(
            "https://api.elevenlabs.io/v1/speech-to-text", "POST",
            mapOf("xi-api-key" to prefs.elevenKey, "Content-Type" to "multipart/form-data; boundary=$boundary"),
            out.toByteArray(), timeoutMs = 60_000,
        )
        if (r.code != 200) throw HttpException(r.code, "Spracherkennung: ${r.code} ${r.body.take(200)}")
        return JSONObject(r.body).optString("text").trim()
    }
}


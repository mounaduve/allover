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

    companion object {
        const val DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"
        const val DEFAULT_RELAY = "https://molli-server.tail4e4456.ts.net/auto"
    }
}

class HttpException(val code: Int, message: String) : Exception(message)

data class Http(val code: Int, val body: String)

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
    c.disconnect()
    return Http(code, text)
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

/** Spracherkennung über ElevenLabs Scribe. Die Aufnahme geht direkt vom Handy dorthin. */
class Stt(private val prefs: Prefs) {
    fun transcribe(pcm16k: ByteArray): String {
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


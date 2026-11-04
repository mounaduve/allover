package de.duve.claudeauto

import android.content.Context
import android.os.Handler
import android.os.Looper
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/**
 * Gemeinsamer Zustand der App. Wartet für jede angesprochene Sitzung im Hintergrund
 * auf die Antwort und liest sie vor, auch wenn gerade ein anderer Chat offen ist.
 */
object Hub {
    lateinit var prefs: Prefs; private set
    lateinit var relay: Relay; private set
    lateinit var stt: Stt; private set
    lateinit var speaker: Speaker; private set
    val io = Executors.newCachedThreadPool()
    private val main = Handler(Looper.getMainLooper())
    private var started = false

    /** Letzte bekannte Antwort je Sitzung (für "Nochmal vorlesen"). */
    val lastReply = ConcurrentHashMap<String, Reply>()
    private val waiting = ConcurrentHashMap<String, Boolean>()
    private val listeners = mutableSetOf<() -> Unit>()

    fun init(context: Context) {
        if (started) return
        prefs = Prefs(context.applicationContext)
        relay = Relay(prefs)
        stt = Stt(prefs)
        speaker = Speaker(context.applicationContext)
        started = true
    }

    private val logBuffer = java.util.concurrent.ConcurrentLinkedQueue<String>()

    /** Protokolliert lokal und schickt die Zeile gebündelt ans Relay. */
    fun log(msg: String) {
        android.util.Log.i("ClaudeAuto", msg)
        logBuffer += "${java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.GERMANY).format(java.util.Date())} $msg"
        io.execute {
            val lines = generateSequence { logBuffer.poll() }.toList()
            if (lines.isNotEmpty() && prefs.deviceToken.isNotBlank()) runCatching { relay.log(lines) }
        }
    }

    fun isWaiting(sessionId: String) = waiting[sessionId] == true

    fun addListener(l: () -> Unit) { listeners += l }
    fun removeListener(l: () -> Unit) { listeners -= l }
    fun changed() = main.post { listeners.toList().forEach { it() } }

    /** Wartet bis zu 20 Minuten auf die nächste Antwort nach `after` und liest sie vor. */
    fun awaitReply(sessionId: String, name: String, after: Long) {
        if (waiting.put(sessionId, true) == true) return
        changed()
        io.execute {
            val until = System.currentTimeMillis() + 20 * 60_000
            var errors = 0
            try {
                while (System.currentTimeMillis() < until) {
                    val r = try { relay.waitReply(sessionId, after) } catch (e: Exception) {
                        log("Antwort abholen fehlgeschlagen: $e")
                        if (++errors > 5) { main.post { speaker.speak("Verbindung zum Relay verloren.") }; break }
                        Thread.sleep(3000); null
                    } ?: continue
                    lastReply[sessionId] = r
                    main.post { speaker.speak("Antwort von $name. ${r.text}") }
                    break
                }
            } finally {
                waiting.remove(sessionId)
                changed()
            }
        }
    }
}

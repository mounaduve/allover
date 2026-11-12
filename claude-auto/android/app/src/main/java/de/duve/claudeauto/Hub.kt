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
    /** Zuletzt gesendeter Text je Sitzung, damit Mouna im Player sieht, was rausging. */
    val lastSent = ConcurrentHashMap<String, String>()
    private val waiting = ConcurrentHashMap<String, Boolean>()
    private val listeners = mutableSetOf<() -> Unit>()

    fun init(context: Context) {
        if (started) return
        prefs = Prefs(context.applicationContext)
        relay = Relay(prefs)
        stt = Stt(prefs, context)
        speaker = Speaker(context.applicationContext)
        started = true
        // Abstürze festhalten und beim nächsten Start ins Protokoll schicken – sonst sehen wir nur „Dienst gestartet“
        prefs.lastCrash.takeIf { it.isNotBlank() }?.let { log("Absturz beim letzten Mal: $it"); prefs.lastCrash = "" }
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            runCatching { prefs.saveCrash("${java.util.Date()} [${t.name}] ${android.util.Log.getStackTraceString(e).take(3000)}") }
            previous?.uncaughtException(t, e)
        }
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

    /** Erhöht beim Aussteigen: laufende Warteschleifen hören auf und lesen nichts mehr vor. */
    @Volatile private var generation = 0

    /** Aus dem Auto ausgestiegen: nicht weiter auf Antworten warten, nichts mehr vorlesen. */
    fun stopAll() {
        generation++
        waiting.clear()
        main.post { speaker.stop() }
        changed()
        log("Ausgestiegen: Warten und Vorlesen beendet")
    }

    /** Antwort wurde vorgelesen oder angezeigt: merken, damit die Liste sie nicht mehr als neu zeigt. */
    fun markHeard(sessionId: String, r: Reply) {
        lastReply[sessionId] = r
        if (r.id > prefs.heardReply(sessionId)) { prefs.setHeardReply(sessionId, r.id); prefs.setAskedViaApp(sessionId, false); changed() }
    }

    /** Nachricht ging über die App raus – nur dann interessiert die Antwort hier (Ansage, „neue Antwort“). */
    fun markSent(sessionId: String, text: String) {
        lastSent[sessionId] = text
        prefs.setAskedViaApp(sessionId, true)
    }

    /**
     * Neue Antwort auf eine Nachricht aus der App, die Mouna noch nicht gehört hat. Antworten auf Arbeit direkt in der
     * Claude-App zählen nicht – die hat sie dort schon gelesen (Mouna 12.11.).
     */
    fun hasNewReply(s: ChatSession): Boolean {
        if (!prefs.askedViaApp(s.id)) return false
        val heard = prefs.heardReply(s.id)
        if (heard < 0) { prefs.setHeardReply(s.id, s.lastReplyId); return false }
        return s.lastReplyId > heard
    }

    fun stateLabel(s: ChatSession) = when {
        isWaiting(s.id) -> "wartet auf Antwort"
        hasNewReply(s) -> "neue Antwort"
        s.busy -> "arbeitet"
        else -> "bereit"
    }
    fun anyWaiting() = waiting.isNotEmpty()

    /** Sitzung, deren Antwort gerade gekommen ist – der Auto-Player springt auf sie, damit Mouna dort direkt antworten kann. */
    @Volatile var replyFocus: String? = null

    fun addListener(l: () -> Unit) { listeners += l }
    fun removeListener(l: () -> Unit) { listeners -= l }
    fun changed() = main.post { listeners.toList().forEach { it() } }

    /**
     * Wartet bis zu 20 Minuten auf die nächste Antwort nach `after` und liest sie vor.
     * `onReply` bekommt die Antwort (null = keine gekommen), `onSpoken` läuft, wenn fertig vorgelesen ist.
     * false = für diese Sitzung wird schon gewartet.
     */
    fun awaitReply(
        sessionId: String, name: String, after: Long,
        onReply: ((Reply?) -> Unit)? = null, onSpoken: (() -> Unit)? = null,
    ): Boolean {
        if (waiting.put(sessionId, true) == true) return false
        changed()
        val gen = generation
        io.execute {
            val until = System.currentTimeMillis() + 20 * 60_000
            var errors = 0
            var got: Reply? = null
            try {
                while (System.currentTimeMillis() < until && gen == generation) {
                    val r = try { relay.waitReply(sessionId, after) } catch (e: Exception) {
                        // Im Hintergrund drosselt Android das Netz – nicht aufgeben, sondern mit wachsendem Abstand
                        // weiter versuchen, bis die 20 Minuten um sind. Die Antwort liegt ja sicher auf dem Relay.
                        log("Antwort abholen fehlgeschlagen: $e")
                        Thread.sleep(minOf(30_000L, 3_000L * ++errors)); null
                    } ?: continue
                    errors = 0
                    if (gen != generation) break // inzwischen ausgestiegen
                    markHeard(sessionId, r)
                    got = r
                    replyFocus = sessionId
                    main.post { speaker.speak(r.text, onSpoken) } // Mouna will direkt die Antwort hören, ohne Vorspann
                    break
                }
            } finally {
                if (gen == generation) waiting.remove(sessionId)
                changed()
                onReply?.let { cb -> main.post { cb(got) } }
            }
        }
        return true
    }
}

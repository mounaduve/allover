package de.duve.claudeauto

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Color
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView

/**
 * Gespräch am Handy: Sitzung wählen, auf den großen Knopf tippen, sprechen.
 * Gesendet wird nach einer Sprechpause (oder per Tipp, je nach Schalter), die Antwort wird vorgelesen
 * und danach hört die App von selbst wieder zu. Sagt Mouna dann eine Weile nichts, pausiert das Gespräch.
 */
class TalkActivity : Activity() {
    private enum class State { IDLE, LISTENING, RECOGNIZING, WAITING, SPEAKING }

    private val main = Handler(Looper.getMainLooper())
    private var state = State.IDLE
    private var sessions: List<ChatSession> = emptyList()
    private var recorder: PhoneRecorder? = null
    /** Jeder Stopp erhöht die Runde; Rückmeldungen aus alten Runden werden ignoriert. */
    private var turn = 0
    private var note = ""

    private lateinit var picker: Spinner
    private lateinit var big: Button
    private lateinit var status: TextView
    private lateinit var pauseBtn: Button
    private lateinit var log: TextView
    private lateinit var scroll: ScrollView
    private val tones by lazy { ToneGenerator(AudioManager.STREAM_MUSIC, 90) }
    private val listener = { updateUi() }

    private val current: ChatSession? get() = sessions.getOrNull(picker.selectedItemPosition)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Hub.init(this)
        val dp = resources.displayMetrics.density
        val pad = (16 * dp).toInt()
        val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(pad, pad * 2, pad, pad) }

        val top = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        picker = Spinner(this)
        top.addView(picker, LinearLayout.LayoutParams(0, -2, 1f))
        top.addView(Button(this).apply { text = "↻"; setOnClickListener { loadSessions() } })
        col.addView(top)
        col.addView(CheckBox(this).apply {
            text = "Bei Sprechpause automatisch senden"
            isChecked = Hub.prefs.autoSend
            setOnCheckedChangeListener { _, on -> Hub.prefs.autoSend = on; updateUi() }
        })

        big = Button(this).apply {
            textSize = 22f
            setTextColor(Color.WHITE)
            isAllCaps = false
            setOnClickListener { onBig() }
        }
        col.addView(big, LinearLayout.LayoutParams(-1, (180 * dp).toInt()).apply { topMargin = pad })
        status = TextView(this).apply { textSize = 15f; setPadding(0, pad / 2, 0, 0); gravity = Gravity.CENTER_HORIZONTAL }
        col.addView(status)

        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        pauseBtn = Button(this).apply {
            setOnClickListener { if (Hub.speaker.paused) Hub.speaker.resume() else Hub.speaker.pause() }
        }
        row.addView(pauseBtn, LinearLayout.LayoutParams(0, -2, 1f))
        row.addView(Button(this).apply { text = "Stopp"; setOnClickListener { stopAll("Gespräch beendet.") } },
            LinearLayout.LayoutParams(0, -2, 1f))
        col.addView(row)

        log = TextView(this).apply { textSize = 16f; setTextIsSelectable(true); setPadding(0, pad, 0, pad) }
        scroll = ScrollView(this).apply { addView(log, ViewGroup.LayoutParams(-1, -2)) }
        col.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(col)

        picker.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: android.view.View?, pos: Int, id: Long) {
                val s = sessions.getOrNull(pos) ?: return
                if (s.id == Hub.prefs.talkSession && log.text.isNotEmpty()) return
                Hub.prefs.talkSession = s.id
                showLastReply(s)
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.BLUETOOTH_CONNECT), 1)
        Hub.addListener(listener)
        loadSessions()
        updateUi()
    }

    override fun onDestroy() {
        Hub.removeListener(listener)
        turn++
        recorder?.stop()
        super.onDestroy()
    }

    private fun loadSessions() {
        if (Hub.prefs.deviceToken.isBlank()) { note = "Noch nicht gekoppelt – erst in Claude Auto koppeln."; updateUi(); return }
        Hub.io.execute {
            try {
                val st = Hub.relay.status()
                runOnUiThread {
                    sessions = st.sessions
                    picker.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, sessions.map { it.name })
                    sessions.indexOfFirst { it.id == Hub.prefs.talkSession }.takeIf { it >= 0 }?.let { picker.setSelection(it) }
                    note = when {
                        !st.macOnline && sessions.isEmpty() -> "Mac offline oder schläft."
                        sessions.isEmpty() -> "Keine Sitzung offen."
                        else -> ""
                    }
                    updateUi()
                }
            } catch (e: Exception) {
                runOnUiThread { note = "Keine Verbindung: ${e.message}"; updateUi() }
            }
        }
    }

    /** Beim Wechsel der Sitzung die letzte Antwort anzeigen (nicht vorlesen). */
    private fun showLastReply(s: ChatSession) {
        log.text = ""
        Hub.io.execute {
            val r = runCatching { Hub.relay.waitReply(s.id, 0, wait = 0) }.getOrNull() ?: return@execute
            Hub.lastReply[s.id] = r
            runOnUiThread { if (current?.id == s.id) append("Letzte Antwort", r.text) }
        }
    }

    private fun onBig() {
        when (state) {
            State.IDLE -> startListening()
            State.LISTENING -> { recorder?.stop(); beep(double = true) }
            State.SPEAKING -> { Hub.speaker.stop(); startListening() } // unterbrechen und gleich antworten
            State.RECOGNIZING, State.WAITING -> {}
        }
    }

    private fun startListening() {
        val s = current ?: run { note = "Bitte zuerst eine Sitzung wählen."; updateUi(); return }
        Hub.speaker.stop()
        val t = ++turn
        note = ""
        state = State.LISTENING
        updateUi()
        beep()
        // Erst nach dem Ton aufnehmen, damit er nicht mit drauf ist
        main.postDelayed({
            if (t != turn) return@postDelayed
            val rec = PhoneRecorder(this, Hub.prefs.swapBytes, stopOnPause = Hub.prefs.autoSend, noSpeechSeconds = NO_SPEECH_SECONDS)
            recorder = rec
            Hub.io.execute { record(rec, s, t) }
        }, 250)
    }

    private fun record(rec: PhoneRecorder, s: ChatSession, t: Int) {
        val pcm = try { rec.record() } catch (e: Exception) { Hub.log("Aufnahme fehlgeschlagen: $e"); null }
        recorder = null
        if (t != turn) return
        if (pcm == null || !rec.heardSpeech || pcm.size < 16000) { ui(t) { pauseTalk("Nichts gehört – Gespräch pausiert.") }; return }
        ui(t) { state = State.RECOGNIZING; updateUi() }
        val text = try { Hub.stt.transcribe(pcm) } catch (e: Exception) {
            Hub.log("Spracherkennung fehlgeschlagen: ${e.message}")
            ui(t) { pauseTalk("Spracherkennung fehlgeschlagen.") }; return
        }
        if (text.isBlank()) { ui(t) { pauseTalk("Nichts verstanden – Gespräch pausiert.") }; return }
        ui(t) { append("Du", text); state = State.WAITING; updateUi() }
        try {
            val after = maxOf(
                Hub.lastReply[s.id]?.id ?: 0,
                runCatching { Hub.relay.status().sessions.firstOrNull { it.id == s.id }?.lastReplyId }.getOrNull() ?: s.lastReplyId,
            )
            Hub.relay.send(s.id, text)
            Hub.lastSent[s.id] = text
            val ok = Hub.awaitReply(s.id, s.name, after,
                onReply = { r ->
                    if (t == turn) {
                        if (r == null) pauseTalk("Keine Antwort gekommen.")
                        else { append(s.name, r.text); state = State.SPEAKING; updateUi() }
                    }
                },
                // Nach dem Vorlesen von selbst wieder zuhören – so entsteht ein Gespräch ohne Tippen
                onSpoken = { main.post { if (t == turn && state == State.SPEAKING) startListening() } },
            )
            if (!ok) ui(t) { pauseTalk("Diese Sitzung wartet schon auf eine Antwort.") }
        } catch (e: Exception) {
            Hub.log("Senden fehlgeschlagen: $e")
            ui(t) { pauseTalk("Senden fehlgeschlagen: ${e.message}") }
        }
    }

    /** Gespräch anhalten, ohne laufendes Vorlesen abzubrechen. */
    private fun pauseTalk(msg: String) {
        state = State.IDLE
        note = msg
        tones.startTone(ToneGenerator.TONE_PROP_NACK, 200)
        updateUi()
    }

    private fun stopAll(msg: String) {
        turn++
        recorder?.stop()
        Hub.speaker.stop()
        state = State.IDLE
        note = msg
        updateUi()
    }

    private fun ui(t: Int, block: () -> Unit) = runOnUiThread { if (t == turn) block() }

    private fun append(who: String, text: String) {
        log.append((if (log.text.isEmpty()) "" else "\n\n") + "$who:\n$text")
        scroll.post { scroll.fullScroll(ScrollView.FOCUS_DOWN) }
    }

    private fun beep(double: Boolean = false) {
        tones.startTone(ToneGenerator.TONE_PROP_BEEP, 150)
        if (double) main.postDelayed({ tones.startTone(ToneGenerator.TONE_PROP_BEEP, 150) }, 220)
    }

    private fun updateUi() {
        if (!::big.isInitialized) return
        val auto = Hub.prefs.autoSend
        big.text = when (state) {
            State.IDLE -> "🎤  Sprechen"
            State.LISTENING -> if (auto) "Ich höre zu …\nPause = senden, Tippen = sofort" else "Ich höre zu …\nTippen = senden"
            State.RECOGNIZING -> "Erkenne …"
            State.WAITING -> "Warte auf Antwort …"
            State.SPEAKING -> "Liest vor …\nTippen = unterbrechen & antworten"
        }
        big.setBackgroundColor(when (state) {
            State.IDLE -> 0xFFC15F3C.toInt()
            State.LISTENING -> 0xFFB3261E.toInt()
            State.SPEAKING -> 0xFF2E7D32.toInt()
            else -> 0xFF6B6460.toInt()
        })
        status.text = note
        pauseBtn.isEnabled = Hub.speaker.speaking
        pauseBtn.text = if (Hub.speaker.paused) "Weiter" else "Pause"
        // Bildschirm an lassen, solange das Gespräch läuft – das Mikrofon geht nur, solange die App offen ist
        if (state == State.IDLE) window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    companion object {
        /** So lange wartet die App nach der Antwort auf Mounas nächsten Satz. */
        const val NO_SPEECH_SECONDS = 8
    }
}

package de.duve.claudeauto

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Gespräch am Handy (Look aus dem Entwurf in Claude Design): Sitzung wählen, auf den großen Knopf tippen, sprechen.
 * Gesendet wird nach einer Sprechpause (oder per Tipp, je nach Schalter), die Antwort wird vorgelesen
 * und danach hört die App von selbst wieder zu. Sagt Mouna dann eine Weile nichts, pausiert das Gespräch.
 */
class TalkActivity : Activity() {
    private enum class State { IDLE, LISTENING, RECOGNIZING, WAITING, SPEAKING }

    private val main = Handler(Looper.getMainLooper())
    private var state = State.IDLE
    private var sessions: List<ChatSession> = emptyList()
    private var current: ChatSession? = null
    private var recorder: PhoneRecorder? = null
    /** Jeder Stopp erhöht die Runde; Rückmeldungen aus alten Runden werden ignoriert. */
    private var turn = 0
    private var note = ""

    private lateinit var dot: View
    private lateinit var sessionLabel: TextView
    private lateinit var sessionName: TextView
    private lateinit var messages: LinearLayout
    private lateinit var scroll: ScrollView
    private lateinit var progressRow: LinearLayout
    private lateinit var progressFill: View
    private lateinit var posText: TextView
    private lateinit var durText: TextView
    private lateinit var bars: LevelBars
    private lateinit var halo: FrameLayout
    private lateinit var big: FrameLayout
    private lateinit var bigIcon: ImageView
    private lateinit var pauseBtn: FrameLayout
    private lateinit var stopBtn: FrameLayout
    private lateinit var caption: TextView
    private var working: View? = null
    private var lastClaudeLabel: TextView? = null
    private var lastSentLabel: TextView? = null

    private val tones by lazy { ToneGenerator(AudioManager.STREAM_MUSIC, 90) }
    private val listener = { updateUi() }
    private val ticker = object : Runnable {
        override fun run() { updateProgress(); main.postDelayed(this, 250) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Hub.init(this)
        ivoryBars()
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(C.IVORY) }

        // Kopf: Zeichen, „Gespräch“, Einstellungen
        val head = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(20), dp(16), dp(12), dp(12))
        }
        head.addView(icon(R.drawable.ui_spark, C.CLAY_LIGHT, 26))
        head.addView(text("Gespräch", 24f, serif = true, bold = true).apply { setPadding(dp(10), 0, 0, 0) },
            LinearLayout.LayoutParams(0, -2, 1f))
        head.addView(circleButton(R.drawable.ui_gear, 44, 22, C.IVORY, C.SLATE, "Einstellungen").apply {
            setOnClickListener { startActivity(Intent(this@TalkActivity, MainActivity::class.java)) }
        })
        root.addView(head)

        // Sitzungswahl
        val picker = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
            minimumHeight = dp(60)
            setPadding(dp(16), dp(10), dp(16), dp(10))
            pressable(rounded(C.WHITE, 16, C.BORDER, 1))
            setOnClickListener { chooseSession() }
        }
        dot = View(this).apply { background = oval(C.GREEN) }
        picker.addView(dot, LinearLayout.LayoutParams(dp(10), dp(10)))
        val pcol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(12), 0, 0, 0) }
        sessionLabel = text("Sitzung", 12f, C.GREY)
        sessionName = text("Sitzung wählen", 16f, bold = true)
        pcol.addView(sessionLabel); pcol.addView(sessionName)
        picker.addView(pcol, LinearLayout.LayoutParams(0, -2, 1f))
        picker.addView(icon(R.drawable.ui_chevron_down, C.GREY, 20))
        root.addView(picker, LinearLayout.LayoutParams(-1, -2).apply { setMargins(dp(20), 0, dp(20), 0) })

        // Gesprächsverlauf
        messages = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; gravity = Gravity.BOTTOM
            setPadding(dp(20), dp(20), dp(20), dp(16))
        }
        scroll = ScrollView(this).apply { isFillViewport = true; addView(messages, FrameLayout.LayoutParams(-1, -1)) }
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))

        // Bedienleiste unten
        val dock = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(C.DOCK)
            setPadding(dp(20), dp(16), dp(20), dp(24))
        }
        root.addView(View(this).apply { setBackgroundColor(C.BORDER) }, LinearLayout.LayoutParams(-1, dp(1)))

        progressRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        posText = text("0:00", 12f, C.GREY)
        durText = text("0:00", 12f, C.GREY)
        val track = FrameLayout(this).apply { background = rounded(0xFFE0DCD1.toInt(), 2) }
        progressFill = View(this).apply { background = rounded(C.CLAY, 2) }
        track.addView(progressFill, FrameLayout.LayoutParams(0, -1))
        progressRow.addView(posText)
        progressRow.addView(track, LinearLayout.LayoutParams(0, dp(4), 1f).apply { setMargins(dp(10), 0, dp(10), 0) })
        progressRow.addView(durText)
        dock.addView(progressRow, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(14) })

        bars = LevelBars(this) { recorder?.level ?: 0.0 }
        dock.addView(bars, LinearLayout.LayoutParams(-1, dp(40)).apply { bottomMargin = dp(6) })

        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        pauseBtn = circleButton(R.drawable.ui_pause, 56, 22, C.WHITE, C.SLATE, "Pause", C.BORDER2).apply {
            setOnClickListener { if (Hub.speaker.paused) Hub.speaker.resume() else Hub.speaker.pause() }
        }
        stopBtn = circleButton(R.drawable.ui_close, 56, 20, C.WHITE, C.SLATE, "Gespräch beenden", C.BORDER2).apply {
            setOnClickListener { stopAll() }
        }
        halo = FrameLayout(this)
        big = FrameLayout(this).apply { setOnClickListener { onBig() } }
        bigIcon = ImageView(this)
        big.addView(bigIcon, FrameLayout.LayoutParams(dp(36), dp(36), Gravity.CENTER))
        halo.addView(big, FrameLayout.LayoutParams(dp(96), dp(96), Gravity.CENTER))
        row.addView(FrameLayout(this).apply { addView(pauseBtn, FrameLayout.LayoutParams(dp(56), dp(56), Gravity.START or Gravity.CENTER_VERTICAL)) },
            LinearLayout.LayoutParams(0, dp(128), 1f))
        row.addView(halo, LinearLayout.LayoutParams(dp(128), dp(128)))
        row.addView(FrameLayout(this).apply { addView(stopBtn, FrameLayout.LayoutParams(dp(56), dp(56), Gravity.END or Gravity.CENTER_VERTICAL)) },
            LinearLayout.LayoutParams(0, dp(128), 1f))
        dock.addView(row, LinearLayout.LayoutParams(-1, -2))

        caption = text("", 14f, C.TEXT2).apply { gravity = Gravity.CENTER; minLines = 2; setPadding(dp(16), dp(4), dp(16), dp(8)) }
        dock.addView(caption, LinearLayout.LayoutParams(-1, -2))

        val autoRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        val sw = styledSwitch(Hub.prefs.autoSend)
        sw.setOnCheckedChangeListener { _, on -> Hub.prefs.autoSend = on; updateUi() }
        autoRow.addView(sw)
        autoRow.addView(text("Bei Sprechpause automatisch senden", 13f, C.GREY).apply {
            setPadding(dp(8), 0, 0, 0); setOnClickListener { sw.isChecked = !sw.isChecked }
        })
        dock.addView(autoRow)
        root.addView(dock)
        setContentView(root)

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.BLUETOOTH_CONNECT), 1)
        Hub.addListener(listener)
        loadSessions()
        updateUi()
    }

    override fun onResume() { super.onResume(); main.post(ticker); if (sessions.isEmpty()) loadSessions() }
    override fun onPause() { main.removeCallbacks(ticker); super.onPause() }

    override fun onDestroy() {
        Hub.removeListener(listener)
        turn++
        recorder?.stop()
        super.onDestroy()
    }

    // ---------- Sitzungen ----------

    private fun loadSessions() {
        if (Hub.prefs.deviceToken.isBlank()) { note = "Noch nicht gekoppelt – oben rechts in den Einstellungen koppeln."; updateUi(); return }
        Hub.io.execute {
            try {
                val st = Hub.relay.status()
                runOnUiThread {
                    sessions = st.sessions
                    val keep = sessions.firstOrNull { it.id == (current?.id ?: Hub.prefs.talkSession) }
                    if (keep != null && keep.id != current?.id) select(keep) else if (keep != null) current = keep
                    note = when {
                        !st.macOnline && sessions.isEmpty() -> "Der Mac ist offline oder schläft."
                        sessions.isEmpty() -> "Auf dem Mac ist keine Sitzung offen."
                        current == null -> "Oben eine Sitzung wählen."
                        else -> if (note.startsWith("Keine Verbindung")) "" else note
                    }
                    updateUi()
                }
            } catch (e: Exception) {
                runOnUiThread { note = "Keine Verbindung: ${e.message}"; updateUi() }
            }
        }
    }

    private fun chooseSession() {
        loadSessions()
        if (sessions.isEmpty()) return
        AlertDialog.Builder(this)
            .setTitle("Sitzung wählen")
            .setItems(sessions.map { it.name }.toTypedArray()) { _, i -> select(sessions[i]) }
            .show()
    }

    private fun select(s: ChatSession) {
        if (s.id != current?.id) { stopAll(); messages.removeAllViews(); working = null }
        current = s
        Hub.prefs.talkSession = s.id
        note = ""
        updateUi()
        // Letzte Antwort anzeigen, nicht vorlesen
        Hub.io.execute {
            val r = runCatching { Hub.relay.waitReply(s.id, 0, wait = 0) }.getOrNull() ?: return@execute
            Hub.lastReply[s.id] = r
            runOnUiThread { if (current?.id == s.id && messages.childCount == 0) addClaude(r.text) }
        }
    }

    // ---------- Ablauf ----------

    private fun onBig() {
        when (state) {
            State.IDLE -> startListening()
            State.LISTENING -> { recorder?.stop(); beep(double = true) }
            State.SPEAKING -> { Hub.speaker.stop(); startListening() } // unterbrechen und gleich antworten
            State.RECOGNIZING, State.WAITING -> {}
        }
    }

    private fun startListening() {
        val s = current ?: run { note = "Bitte zuerst oben eine Sitzung wählen."; updateUi(); return }
        Hub.speaker.stop()
        val t = ++turn
        note = ""
        state = State.LISTENING
        updateUi()
        beep()
        // Erst nach dem Ton aufnehmen, damit er nicht mit drauf ist
        main.postDelayed({
            if (t != turn) return@postDelayed
            val rec = PhoneRecorder(this, Hub.prefs.swapBytes, stopOnPause = Hub.prefs.autoSend, noSpeechSeconds = Hub.prefs.silenceSeconds,
                pauseSeconds = Hub.prefs.sendPauseSeconds.toDouble())
            recorder = rec
            Hub.io.execute { record(rec, s, t) }
        }, 250)
    }

    private fun record(rec: PhoneRecorder, s: ChatSession, t: Int) {
        val pcm = try { rec.record() } catch (e: Exception) { Hub.log("Aufnahme fehlgeschlagen: $e"); null }
        recorder = null
        if (t != turn) return
        if (pcm == null || !rec.heardSpeech || pcm.size < 16000) { ui(t) { pauseTalk("Nichts gehört – Gespräch pausiert. Tippen zum Weiterreden.") }; return }
        ui(t) { state = State.RECOGNIZING; updateUi() }
        val text = try { Hub.stt.transcribe(pcm) } catch (e: Exception) {
            Hub.log("Spracherkennung fehlgeschlagen: ${e.message}")
            ui(t) { pauseTalk("Spracherkennung fehlgeschlagen.") }; return
        }
        if (text.isBlank()) { ui(t) { pauseTalk("Nichts verstanden – Gespräch pausiert.") }; return }
        ui(t) { addMine(text); state = State.WAITING; updateUi() }
        try {
            val after = maxOf(
                Hub.lastReply[s.id]?.id ?: 0,
                runCatching { Hub.relay.status().sessions.firstOrNull { it.id == s.id }?.lastReplyId }.getOrNull() ?: s.lastReplyId,
            )
            Hub.relay.send(s.id, text)
            Hub.lastSent[s.id] = text
            ui(t) { lastSentLabel?.text = "gesendet" }
            val ok = Hub.awaitReply(s.id, s.name, after,
                onReply = { r ->
                    if (t == turn) {
                        if (r == null) pauseTalk("Keine Antwort gekommen.")
                        else { addClaude(r.text, reading = true); state = State.SPEAKING; updateUi() }
                    }
                },
                onSpoken = {
                    main.post {
                        lastClaudeLabel?.text = "Claude"
                        if (t != turn || state != State.SPEAKING) return@post
                        // Nach dem Vorlesen von selbst wieder zuhören – so entsteht ein Gespräch ohne Tippen
                        if (Hub.prefs.autoListen) startListening() else { state = State.IDLE; updateUi() }
                    }
                },
            )
            if (!ok) ui(t) { pauseTalk("Diese Sitzung wartet schon auf eine Antwort.") }
        } catch (e: Exception) {
            Hub.log("Senden fehlgeschlagen: $e")
            ui(t) { lastSentLabel?.text = "nicht gesendet"; pauseTalk("Senden fehlgeschlagen: ${e.message}") }
        }
    }

    /** Gespräch anhalten, ohne laufendes Vorlesen abzubrechen. */
    private fun pauseTalk(msg: String) {
        state = State.IDLE
        note = msg
        tones.startTone(ToneGenerator.TONE_PROP_NACK, 200)
        updateUi()
    }

    private fun stopAll() {
        turn++
        recorder?.stop()
        Hub.speaker.stop()
        lastClaudeLabel?.text = "Claude"
        state = State.IDLE
        note = ""
        updateUi()
    }

    private fun ui(t: Int, block: () -> Unit) = runOnUiThread { if (t == turn) block() }

    private fun beep(double: Boolean = false) {
        tones.startTone(ToneGenerator.TONE_PROP_BEEP, 150)
        if (double) main.postDelayed({ tones.startTone(ToneGenerator.TONE_PROP_BEEP, 150) }, 220)
    }

    // ---------- Verlauf ----------

    private fun addClaude(t: String, reading: Boolean = false) {
        removeWorking()
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val label = text(if (reading) "Claude · liest vor" else "Claude", 12f, C.LABEL, bold = true).apply { letterSpacing = 0.02f }
        box.addView(label)
        // Zitierte Frage („> Aus dem Auto: …“) nicht anzeigen – Mouna will nur die Antwort sehen
        val shown = t.replace(Regex("(?m)^>\\s*Aus dem Auto:[^\\n]*\\n*"), "").replace(Regex("[*`#]+"), "").trim()
        box.addView(text(shown, 18f, C.TEXT2, serif = true).apply {
            setLineSpacing(0f, 1.3f); setTextIsSelectable(true); setPadding(0, dp(6), dp(24), 0)
        })
        lastClaudeLabel = label
        addMessage(box)
    }

    private fun addMine(t: String) {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.END }
        box.addView(text(t, 16f).apply {
            background = GradientDrawable_bubble()
            setPadding(dp(16), dp(12), dp(16), dp(12))
            setLineSpacing(0f, 1.2f)
        }, LinearLayout.LayoutParams(-2, -2).apply { leftMargin = dp(56) })
        val sent = text("wird gesendet …", 12f, C.GREY).apply { setPadding(0, dp(4), dp(4), 0) }
        box.addView(sent)
        lastSentLabel = sent
        addMessage(box)
        // „Claude arbeitet …“ bis die Antwort da ist
        val w = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        listOf(C.CLAY_LIGHT, 0xFFE8B4A0.toInt(), 0xFFF2D6CB.toInt()).forEach { c ->
            w.addView(View(this).apply { background = oval(c) }, LinearLayout.LayoutParams(dp(7), dp(7)).apply { rightMargin = dp(5) })
        }
        w.addView(text("Claude arbeitet …", 14f, C.GREY).apply { setPadding(dp(5), 0, 0, 0) })
        working = w
        addMessage(w)
    }

    private fun GradientDrawable_bubble() = android.graphics.drawable.GradientDrawable().apply {
        setColor(C.BUBBLE)
        val r = dp(18).toFloat(); val s = dp(4).toFloat()
        cornerRadii = floatArrayOf(r, r, r, r, s, s, r, r)
    }

    private fun removeWorking() { working?.let { messages.removeView(it) }; working = null }

    private fun addMessage(v: View) {
        messages.addView(v, LinearLayout.LayoutParams(-1, -2).apply { topMargin = if (messages.childCount == 0) 0 else dp(18) })
        scroll.post { scroll.fullScroll(View.FOCUS_DOWN) }
    }

    // ---------- Anzeige ----------

    private fun updateUi() {
        if (!::big.isInitialized) return
        if (state == State.IDLE || state == State.SPEAKING) removeWorking()
        val c = current
        sessionName.text = c?.name ?: "Sitzung wählen"
        val waiting = c != null && Hub.isWaiting(c.id)
        sessionLabel.text = "Sitzung · " + when {
            c == null -> "keine gewählt"
            waiting -> "wartet auf Antwort"
            c.busy -> "arbeitet"
            else -> "bereit"
        }
        dot.background = oval(if (waiting || c?.busy == true) C.CLAY_LIGHT else if (c == null) C.BORDER2 else C.GREEN)

        when (state) {
            State.IDLE -> setBig(C.CLAY, R.drawable.ui_mic, C.WHITE, "Sprechen", halo = false)
            State.LISTENING -> setBig(C.CLAY, R.drawable.ui_arrow_up, C.WHITE, "Jetzt senden", halo = true)
            State.RECOGNIZING, State.WAITING -> setBig(C.IVORY, R.drawable.ui_clock, C.MUTED, "Warte auf Antwort", halo = false, dashed = true)
            State.SPEAKING -> setBig(C.SLATE, R.drawable.ui_mic, C.IVORY, "Unterbrechen und antworten", halo = false)
        }
        caption.text = note.ifBlank {
            when (state) {
                State.IDLE -> if (c == null) "Oben eine Sitzung wählen" else "Tippen und losreden"
                State.LISTENING -> if (Hub.prefs.autoSend) "Ich höre zu. Eine kurze Pause sendet – oder tippen für sofort." else "Ich höre zu. Tippen zum Senden."
                State.RECOGNIZING -> "Erkenne …"
                State.WAITING -> "Gesendet. Die Antwort wird gleich vorgelesen."
                State.SPEAKING -> "Tippen, um zu unterbrechen und direkt zu antworten"
            }
        }
        bars.visibility = if (state == State.LISTENING) View.VISIBLE else View.GONE
        progressRow.visibility = if (Hub.speaker.speaking) View.VISIBLE else View.GONE
        pauseBtn.visibility = if (Hub.speaker.speaking) View.VISIBLE else View.INVISIBLE
        (pauseBtn.getChildAt(0) as ImageView).setImageResource(if (Hub.speaker.paused) R.drawable.ui_play else R.drawable.ui_pause)
        pauseBtn.contentDescription = if (Hub.speaker.paused) "Weiter" else "Pause"
        stopBtn.visibility = if (state != State.IDLE || Hub.speaker.speaking) View.VISIBLE else View.INVISIBLE
        updateProgress()
        // Bildschirm an lassen, solange das Gespräch läuft – das Mikrofon geht nur, solange die App offen ist
        if (state == State.IDLE && !Hub.speaker.speaking) window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun setBig(bg: Int, res: Int, tint: Int, desc: String, halo: Boolean, dashed: Boolean = false) {
        big.pressable(if (dashed) android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setColor(bg); setStroke(dp(2), 0xFFCFCABD.toInt(), dp(6).toFloat(), dp(5).toFloat())
        } else oval(bg, if (halo) 0x38D97757 else 0, if (halo) 8 else 0))
        big.elevation = if (state == State.IDLE) dp(6).toFloat() else 0f
        big.contentDescription = desc
        bigIcon.setImageResource(res)
        bigIcon.imageTintList = android.content.res.ColorStateList.valueOf(tint)
        this.halo.background = if (halo) oval(0x24D97757) else null
    }

    private fun updateProgress() {
        if (!::progressFill.isInitialized || !Hub.speaker.speaking) return
        val dur = Hub.speaker.durationMs
        val pos = Hub.speaker.positionMs().coerceAtMost(dur)
        posText.text = fmt(pos); durText.text = fmt(dur)
        val track = progressFill.parent as View
        val w = if (dur > 0) (track.width * pos / dur).toInt() else 0
        if (progressFill.layoutParams.width != w) { progressFill.layoutParams.width = w; progressFill.requestLayout() }
    }

    private fun fmt(ms: Long) = "%d:%02d".format(ms / 60000, (ms / 1000) % 60)
}

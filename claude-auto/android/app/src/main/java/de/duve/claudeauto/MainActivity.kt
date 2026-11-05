package de.duve.claudeauto

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast

/** Einstellungen (Look aus dem Entwurf in Claude Design): Verbindung, Gespräch, Stimme, Spracherkennung. */
class MainActivity : Activity() {
    private lateinit var connDot: View
    private lateinit var connTitle: TextView
    private lateinit var connInfo: TextView
    private lateinit var relay: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Hub.init(this)
        ivoryBars()
        val p = Hub.prefs
        val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(8), dp(20), dp(40)) }

        // Kopf
        val head = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        head.addView(circleButton(R.drawable.ui_back, 44, 22, C.IVORY, C.SLATE, "Zum Gespräch").apply {
            setOnClickListener { openTalk() }
        }, LinearLayout.LayoutParams(dp(44), dp(44)).apply { leftMargin = -dp(12) })
        head.addView(text("Einstellungen", 24f, serif = true, bold = true).apply { setPadding(dp(4), 0, 0, 0) })
        col.addView(head, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) })

        // Verbindung zum Mac
        val conn = section(col, "Verbindung zum Mac")
        val cRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        connDot = View(this).apply { background = oval(C.BORDER2) }
        cRow.addView(connDot, LinearLayout.LayoutParams(dp(10), dp(10)))
        connTitle = text("Prüfe …", 16f, bold = true).apply { setPadding(dp(10), 0, 0, 0) }
        cRow.addView(connTitle, LinearLayout.LayoutParams(0, -2, 1f))
        conn.addView(cRow)
        connInfo = text("", 14f, C.GREY).apply { setPadding(0, dp(6), 0, 0); visibility = View.GONE }
        conn.addView(connInfo)
        val btns = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        btns.addView(pill("Verbindung testen") { test() }, LinearLayout.LayoutParams(0, -2, 1f).apply { rightMargin = dp(8) })
        btns.addView(pill(if (p.deviceToken.isBlank()) "Mit Mac koppeln" else "Neu koppeln") { pair() }, LinearLayout.LayoutParams(0, -2, 1f))
        conn.addView(btns, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) })
        conn.addView(text("Relay-Adresse", 13f, C.GREY).apply { setPadding(0, dp(14), 0, dp(6)) })
        relay = field(p.relayUrl, InputType.TYPE_TEXT_VARIATION_URI)
        conn.addView(relay)

        // Gespräch
        val talk = section(col, "Gespräch", padded = false)
        switchRow(talk, "Bei Sprechpause senden", "Aus: Senden nur per Tipp", p.autoSend, true) { p.autoSend = it }
        switchRow(talk, "Nach der Antwort weiter zuhören", "Piep, dann direkt antworten", p.autoListen, true) { p.autoListen = it }
        val silence = listOf(5, 8, 15)
        val sRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(10), dp(12), dp(10)); minimumHeight = dp(56)
        }
        sRow.addView(text("Gespräch endet nach Stille von", 16f), LinearLayout.LayoutParams(0, -2, 1f))
        sRow.addView(spinner(silence.map { "$it s" }, silence.indexOf(p.silenceSeconds).coerceAtLeast(1)) { p.silenceSeconds = silence[it] })
        talk.addView(sRow)

        // Stimme
        val voice = section(col, "Stimme")
        val seg = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            background = rounded(C.DOCK, 12)
            setPadding(dp(4), dp(4), dp(4), dp(4))
        }
        val segHandy = segment("Handy · kostenlos")
        val segEleven = segment("ElevenLabs")
        seg.addView(segHandy, LinearLayout.LayoutParams(0, dp(40), 1f))
        seg.addView(segEleven, LinearLayout.LayoutParams(0, dp(40), 1f))
        voice.addView(seg)

        val handyBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        handyBox.addView(text("Handy-Stimme", 13f, C.GREY).apply { setPadding(0, dp(14), 0, dp(6)) })
        val handyList = styledSpinner()
        handyBox.addView(handyList, LinearLayout.LayoutParams(-1, dp(44)))
        voice.addView(handyBox)

        val elevenBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        elevenBox.addView(text("ElevenLabs-Stimme (verbraucht Credits)", 13f, C.GREY).apply { setPadding(0, dp(14), 0, dp(6)) })
        val elevenList = styledSpinner()
        elevenBox.addView(elevenList, LinearLayout.LayoutParams(-1, dp(44)))
        val elevenIds = mutableListOf<String>()
        fun loadEleven() {
            Hub.io.execute {
                try {
                    val vs = loadElevenVoices(p.elevenKey)
                    runOnUiThread {
                        elevenIds.clear(); elevenIds += vs.map { it.id }
                        elevenList.tag = null
                        elevenList.adapter = adapter(vs.map { v -> v.name + (if (v.info.isNotBlank()) " (${v.info})" else "") + (if (v.category == "premade") "" else " – ${v.category}") })
                        elevenIds.indexOf(p.elevenVoice).takeIf { it >= 0 }?.let { elevenList.setSelection(it) }
                        elevenList.post { elevenList.tag = "bereit" }
                        toast("${vs.size} Stimmen. Antippen spielt eine Probe und prüft, ob sie mit deinem Konto geht.")
                    }
                } catch (e: Exception) {
                    Hub.log("ElevenLabs-Stimmen laden fehlgeschlagen: ${e.message}")
                    toast("Stimmen laden fehlgeschlagen: ${e.message}")
                }
            }
        }
        elevenList.onItemSelectedListener = onPick { pos ->
            if (elevenList.tag == null) return@onPick
            val vid = elevenIds.getOrNull(pos) ?: return@onPick
            Hub.io.execute {
                val err = Hub.speaker.previewEleven(vid)
                if (err == null) { p.elevenVoice = vid; Hub.speaker.elevenBlocked = false; toast("Stimme gespeichert – geht mit deinem Konto.") }
                else toast("Diese Stimme geht nicht: $err. Bitte eine andere wählen.")
            }
        }
        voice.addView(elevenBox)

        fun showVoice() {
            val eleven = p.naturalVoice
            segHandy.isSelected = !eleven; segEleven.isSelected = eleven
            styleSegment(segHandy); styleSegment(segEleven)
            handyBox.visibility = if (eleven) View.GONE else View.VISIBLE
            elevenBox.visibility = if (eleven) View.VISIBLE else View.GONE
            if (eleven && elevenIds.isEmpty()) loadEleven()
        }
        segHandy.setOnClickListener { p.naturalVoice = false; Hub.speaker.elevenBlocked = false; showVoice() }
        segEleven.setOnClickListener {
            if (p.elevenKey.isBlank()) { toast("Erst unten den ElevenLabs-Schlüssel eintragen."); return@setOnClickListener }
            p.naturalVoice = true; Hub.speaker.elevenBlocked = false; showVoice()
        }

        val voiceNames = mutableListOf<String>()
        fun loadHandyVoices() {
            val vs = Hub.speaker.germanVoices()
            voiceNames.clear(); voiceNames += vs.map { it.name }
            handyList.tag = null
            handyList.adapter = adapter(vs.mapIndexed { i, v ->
                "Stimme ${i + 1}" + (if (v.isNetworkConnectionRequired) " · online" else "") + (if (v.features.contains("notInstalled")) " · nicht geladen" else "")
            }.ifEmpty { listOf("Stimmen werden geladen …") })
            voiceNames.indexOf(p.androidVoice).takeIf { it >= 0 }?.let { handyList.setSelection(it) }
            handyList.post { handyList.tag = "bereit" }
        }
        handyList.onItemSelectedListener = onPick { pos ->
            if (handyList.tag == null) return@onPick
            voiceNames.getOrNull(pos)?.let { if (it != p.androidVoice) { p.androidVoice = it; Hub.speaker.speak("So klinge ich.") } }
        }
        handyList.postDelayed({ loadHandyVoices() }, 1200)

        val rateLabel = text("", 13f, C.GREY).apply { setPadding(0, dp(14), 0, dp(2)) }
        fun showRate() { rateLabel.text = "Sprechtempo · " + "%.2f×".format(p.speechRate).replace('.', ',') }
        showRate()
        voice.addView(rateLabel)
        voice.addView(SeekBar(this).apply {
            max = 18
            progress = ((p.speechRate - 0.7f) / 0.05f).toInt().coerceIn(0, 18)
            progressTintList = android.content.res.ColorStateList.valueOf(C.CLAY)
            thumbTintList = android.content.res.ColorStateList.valueOf(C.CLAY)
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(s: SeekBar?, v: Int, fromUser: Boolean) { if (fromUser) { p.speechRate = 0.7f + v * 0.05f; showRate() } }
                override fun onStartTrackingTouch(s: SeekBar?) {}
                override fun onStopTrackingTouch(s: SeekBar?) {}
            })
        }, LinearLayout.LayoutParams(-1, dp(36)))
        voice.addView(pill("Probe hören", dark = true) { Hub.speaker.stop(); Hub.speaker.speak("Hallo Mouna, so klinge ich.") },
            LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })
        showVoice()

        // Spracherkennung
        val stt = section(col, "Spracherkennung", padded = false)
        val kRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(12), dp(16), dp(12)); minimumHeight = dp(56)
        }
        val kCol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        kCol.addView(text("ElevenLabs-Schlüssel", 16f))
        val kState = text("", 13f)
        fun showKey() {
            kState.text = if (p.elevenKey.isBlank()) "fehlt" else "gespeichert"
            kState.setTextColor(if (p.elevenKey.isBlank()) C.CLAY else C.GREEN)
        }
        showKey()
        kCol.addView(kState)
        kRow.addView(kCol, LinearLayout.LayoutParams(0, -2, 1f))
        kRow.addView(pill("Ändern") {
            val input = field("", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD).apply { hint = "Schlüssel einfügen" }
            AlertDialog.Builder(this).setTitle("ElevenLabs-Schlüssel")
                .setView(LinearLayout(this).apply { setPadding(dp(20), dp(8), dp(20), 0); addView(input, LinearLayout.LayoutParams(-1, -2)) })
                .setPositiveButton("Speichern") { _, _ ->
                    if (input.text.isNotBlank()) { p.elevenKey = input.text.toString(); Hub.speaker.elevenBlocked = false; showKey() }
                }
                .setNegativeButton("Abbrechen", null).show()
        })
        stt.addView(kRow)
        stt.addView(View(this).apply { setBackgroundColor(C.DIVIDER) }, LinearLayout.LayoutParams(-1, dp(1)))
        switchRow(stt, "Auto- oder Headset-Mikrofon", "über Bluetooth, wenn verbunden", p.carMic, false) { p.carMic = it }

        // Erweitert
        val more = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; visibility = View.GONE }
        col.addView(text("Erweitert · Berechtigungen, Byte-Reihenfolge  ▾", 14f, C.GREY).apply {
            minHeight = dp(44); gravity = Gravity.CENTER_VERTICAL; setPadding(dp(4), dp(16), 0, 0)
            setOnClickListener { more.visibility = if (more.visibility == View.GONE) View.VISIBLE else View.GONE }
        })
        val adv = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(C.WHITE, 16, C.BORDER, 1)
        }
        switchRow(adv, "Byte-Reihenfolge tauschen", "nur falls die Erkennung Unsinn liefert", p.swapBytes, true) { p.swapBytes = it }
        adv.addView(pill("Berechtigungen erlauben") {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.POST_NOTIFICATIONS), 1)
        }, LinearLayout.LayoutParams(-1, -2).apply { setMargins(dp(16), dp(12), dp(16), dp(16)) })
        more.addView(adv)
        col.addView(more, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) })

        setContentView(ScrollView(this).apply {
            setBackgroundColor(C.IVORY)
            addView(col, ViewGroup.LayoutParams(-1, -2))
        })
        if (p.deviceToken.isBlank()) showConn(C.BORDER2, "Noch nicht gekoppelt", null) else test()
    }

    override fun onPause() {
        Hub.prefs.relayUrl = relay.text.toString()
        super.onPause()
    }

    override fun onBackPressed() { openTalk() }

    private fun openTalk() {
        startActivity(Intent(this, TalkActivity::class.java))
        finish()
    }

    // ---------- Bausteine ----------

    private fun field(value: String, type: Int) = EditText(this).apply {
        setText(value)
        inputType = type
        textSize = 15f
        setTextColor(C.SLATE)
        background = rounded(C.IVORY, 10, C.BORDER, 1)
        setPadding(dp(12), 0, dp(12), 0)
        minHeight = dp(44)
        isSingleLine = true
    }

    private fun segment(label: String) = TextView(this).apply {
        text = label; textSize = 14f; gravity = Gravity.CENTER
    }

    private fun styleSegment(t: TextView) {
        t.background = if (t.isSelected) rounded(C.WHITE, 9) else null
        t.elevation = if (t.isSelected) dp(1).toFloat() else 0f
        t.setTextColor(if (t.isSelected) C.SLATE else C.GREY)
        t.typeface = if (t.isSelected) android.graphics.Typeface.DEFAULT_BOLD else android.graphics.Typeface.DEFAULT
    }

    private fun styledSpinner() = Spinner(this).apply { background = rounded(C.IVORY, 10, C.BORDER, 1) }

    private fun adapter(items: List<String>) = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, items)

    private fun spinner(items: List<String>, selected: Int, pick: (Int) -> Unit) = styledSpinner().apply {
        adapter = this@MainActivity.adapter(items)
        setSelection(selected)
        onItemSelectedListener = onPick(pick)
    }

    private fun onPick(f: (Int) -> Unit) = object : AdapterView.OnItemSelectedListener {
        override fun onItemSelected(parent: AdapterView<*>?, view: View?, pos: Int, id: Long) = f(pos)
        override fun onNothingSelected(parent: AdapterView<*>?) {}
    }

    private fun toast(t: String) = runOnUiThread { Toast.makeText(this, t, Toast.LENGTH_LONG).show() }

    private fun showConn(dot: Int, title: String, info: String?) = runOnUiThread {
        connDot.background = oval(dot)
        connTitle.text = title
        connInfo.text = info ?: ""
        connInfo.visibility = if (info.isNullOrBlank()) View.GONE else View.VISIBLE
    }

    // ---------- Verbindung ----------

    private fun pair() {
        Hub.prefs.relayUrl = relay.text.toString()
        showConn(C.CLAY_LIGHT, "Fordere Code an …", null)
        Hub.io.execute {
            try {
                val (code, secret) = Hub.relay.pairStart(Build.MODEL ?: "Handy")
                showConn(C.CLAY_LIGHT, "Kopplungscode: $code", "Sag Claude auf dem Mac: „Koppel Code $code“. Die App wartet bis zu 10 Minuten.")
                val until = System.currentTimeMillis() + 10 * 60_000
                while (System.currentTimeMillis() < until) {
                    Thread.sleep(3000)
                    val token = Hub.relay.pairStatus(secret) ?: continue
                    Hub.prefs.deviceToken = token
                    test()
                    return@execute
                }
                showConn(C.CLAY, "Code abgelaufen", "Bitte nochmal koppeln.")
            } catch (e: Exception) {
                showConn(C.CLAY, "Kopplung fehlgeschlagen", e.message)
            }
        }
    }

    private fun test() {
        Hub.prefs.relayUrl = relay.text.toString()
        showConn(C.BORDER2, "Prüfe …", null)
        Hub.io.execute {
            try {
                val s = Hub.relay.status()
                if (s.macOnline) showConn(C.GREEN, "Gekoppelt · Mac online", "${s.sessions.size} Sitzungen offen")
                else showConn(C.CLAY_LIGHT, "Gekoppelt · Mac offline", "Der Mac schläft oder der Vermittler läuft nicht.")
            } catch (e: HttpException) {
                showConn(C.CLAY, if (e.code == 401) "Nicht gekoppelt" else "Fehler ${e.code}", if (e.code == 401) null else e.message)
            } catch (e: Exception) {
                showConn(C.CLAY, "Keine Verbindung", e.message)
            }
        }
    }
}

package de.duve.claudeauto

import android.Manifest
import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/** Einrichtung am Handy: Relay, ElevenLabs-Schlüssel, Mikrofon, Kopplung mit dem Mac. */
class MainActivity : Activity() {
    private lateinit var info: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Hub.init(this)
        val p = Hub.prefs
        val pad = (16 * resources.displayMetrics.density).toInt()
        val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(pad, pad * 2, pad, pad) }
        fun label(t: String) = TextView(this).apply { text = t; textSize = 15f; setPadding(0, pad, 0, 0) }

        col.addView(TextView(this).apply { text = "Claude Auto"; textSize = 24f })
        col.addView(Button(this).apply {
            text = "Gespräch am Handy"
            setOnClickListener { startActivity(android.content.Intent(this@MainActivity, TalkActivity::class.java)) }
        })
        col.addView(label("Relay-Adresse"))
        val relay = EditText(this).apply { setText(p.relayUrl); inputType = InputType.TYPE_TEXT_VARIATION_URI }
        col.addView(relay)
        col.addView(label("ElevenLabs-API-Schlüssel"))
        val key = EditText(this).apply {
            hint = if (p.elevenKey.isBlank()) "einfügen" else "gespeichert – zum Ändern neu einfügen"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }
        col.addView(key)
        val swap = CheckBox(this).apply { text = "Byte-Reihenfolge tauschen (nur falls Erkennung Unsinn liefert)"; isChecked = p.swapBytes }
        col.addView(swap)
        val carMic = CheckBox(this).apply { text = "Im Auto das Automikrofon nutzen (über Bluetooth)"; isChecked = p.carMic }
        col.addView(carMic)
        val natural = CheckBox(this).apply { text = "Natürliche Stimme (ElevenLabs, verbraucht Credits)"; isChecked = p.naturalVoice }
        col.addView(natural)
        col.addView(label("Handy-Stimme"))
        val voiceList = android.widget.Spinner(this)
        col.addView(voiceList)
        val voiceNames = mutableListOf<String>()
        fun loadVoices() {
            val vs = Hub.speaker.germanVoices()
            voiceNames.clear(); voiceNames += vs.map { it.name }
            val labels = vs.mapIndexed { i, v ->
                "Stimme ${i + 1}" + (if (v.isNetworkConnectionRequired) " (online)" else "") +
                    (if (v.features.contains("notInstalled")) " – nicht geladen" else "") + "  [${v.name}]"
            }
            voiceList.adapter = android.widget.ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, labels)
            voiceList.tag = null // erste automatische Auswahl nicht als Wahl werten
            voiceNames.indexOf(p.androidVoice).takeIf { it >= 0 }?.let { voiceList.setSelection(it) }
            voiceList.post { voiceList.tag = "bereit" }
            show("Sprachausgabe: ${Hub.speaker.engineName()}, ${vs.size} deutsche Stimmen.")
        }
        voiceList.onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: android.view.View?, pos: Int, id: Long) {
                if (voiceList.tag == null) return
                voiceNames.getOrNull(pos)?.let { if (it != p.androidVoice) { p.androidVoice = it; Hub.speaker.speak("So klinge ich.") } }
            }
            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
        }
        col.addView(Button(this).apply { text = "Stimmen laden"; setOnClickListener { loadVoices() } })
        voiceList.postDelayed({ loadVoices() }, 1500)
        col.addView(label("ElevenLabs-Stimme"))
        val elevenList = android.widget.Spinner(this)
        col.addView(elevenList)
        val elevenIds = mutableListOf<String>()
        col.addView(Button(this).apply {
            text = "ElevenLabs-Stimmen laden"
            setOnClickListener {
                show("Lade ElevenLabs-Stimmen …")
                Hub.io.execute {
                    try {
                        val vs = loadElevenVoices(p.elevenKey)
                        runOnUiThread {
                            elevenIds.clear(); elevenIds += vs.map { it.id }
                            elevenList.tag = null
                            elevenList.adapter = android.widget.ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item,
                                vs.map { v -> "${v.name}" + (if (v.info.isNotBlank()) " (${v.info})" else "") + (if (v.category == "premade") "" else " – ${v.category}") })
                            elevenIds.indexOf(p.elevenVoice).takeIf { it >= 0 }?.let { elevenList.setSelection(it) }
                            elevenList.post { elevenList.tag = "bereit" }
                            show("${vs.size} Stimmen. Antippen spielt eine Probe und prüft, ob sie mit deinem Konto geht.")
                        }
                    } catch (e: Exception) { show("Stimmen laden fehlgeschlagen: ${e.message}") }
                }
            }
        })
        elevenList.onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: android.view.View?, pos: Int, id: Long) {
                if (elevenList.tag == null) return
                val vid = elevenIds.getOrNull(pos) ?: return
                show("Teste Stimme …")
                Hub.io.execute {
                    val err = Hub.speaker.previewEleven(vid)
                    if (err == null) {
                        p.elevenVoice = vid; Hub.speaker.elevenBlocked = false
                        show("Stimme gespeichert – geht mit deinem Konto.")
                    } else show("Diese Stimme geht nicht: $err. Bitte eine andere wählen.")
                }
            }
            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
        }
        col.addView(label("Sprechtempo (1,0 = normal)"))
        val rate = EditText(this).apply {
            setText(p.speechRate.toString().replace('.', ','))
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
        }
        col.addView(rate)
        col.addView(Button(this).apply {
            text = "Speichern"
            setOnClickListener {
                p.relayUrl = relay.text.toString()
                if (key.text.isNotBlank()) { p.elevenKey = key.text.toString(); key.setText(""); key.hint = "gespeichert" }
                p.swapBytes = swap.isChecked
                p.carMic = carMic.isChecked
                p.naturalVoice = natural.isChecked
                Hub.speaker.elevenBlocked = false
                rate.text.toString().replace(',', '.').toFloatOrNull()?.let { p.speechRate = it }
                show("Gespeichert.")
            }
        })
        col.addView(Button(this).apply {
            text = "Berechtigungen erlauben"
            setOnClickListener {
                requestPermissions(arrayOf(
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.POST_NOTIFICATIONS,
                ), 1)
            }
        })
        col.addView(Button(this).apply { text = "Mit Mac koppeln"; setOnClickListener { pair() } })
        col.addView(Button(this).apply { text = "Verbindung testen"; setOnClickListener { test() } })
        col.addView(Button(this).apply { text = "Vorlesen testen"; setOnClickListener { Hub.speaker.speak("Hallo Mouna, die Sprachausgabe funktioniert.") } })
        info = TextView(this).apply { textSize = 16f; setPadding(0, pad, 0, 0) }
        col.addView(info)
        setContentView(ScrollView(this).apply { addView(col, ViewGroup.LayoutParams(-1, -2)) })
        show(if (p.deviceToken.isBlank()) "Noch nicht gekoppelt." else "Gekoppelt. Im Auto unter den Musik-Apps „Claude Auto“ öffnen.")
    }

    private fun show(t: String) = runOnUiThread { info.text = t }

    private fun pair() {
        show("Fordere Code an …")
        Hub.io.execute {
            try {
                val (code, secret) = Hub.relay.pairStart(Build.MODEL ?: "Handy")
                show("Kopplungscode: $code\n\nSag Claude auf dem Mac: „Koppel Code $code“. Die App wartet bis zu 10 Minuten.")
                val until = System.currentTimeMillis() + 10 * 60_000
                while (System.currentTimeMillis() < until) {
                    Thread.sleep(3000)
                    val token = Hub.relay.pairStatus(secret) ?: continue
                    Hub.prefs.deviceToken = token
                    show("Gekoppelt. Im Auto unter den Musik-Apps „Claude Auto“ öffnen.")
                    return@execute
                }
                show("Code abgelaufen. Bitte nochmal koppeln.")
            } catch (e: Exception) {
                show("Kopplung fehlgeschlagen: ${e.message}")
            }
        }
    }

    private fun test() {
        show("Teste …")
        Hub.io.execute {
            try {
                val s = Hub.relay.status()
                show(if (s.macOnline) "Verbunden. ${s.sessions.size} Sitzungen auf dem Mac." else "Relay erreichbar, aber der Mac ist offline.")
            } catch (e: HttpException) {
                show(if (e.code == 401) "Relay erreichbar, aber nicht gekoppelt." else "Fehler ${e.code}: ${e.message}")
            } catch (e: Exception) {
                show("Keine Verbindung: ${e.message}")
            }
        }
    }
}

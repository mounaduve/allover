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
        col.addView(label("ElevenLabs-Stimmen-ID (leer = Standard)"))
        val voice = EditText(this).apply { setText(if (p.elevenVoice == Prefs.DEFAULT_VOICE) "" else p.elevenVoice) }
        col.addView(voice)
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
                p.elevenVoice = voice.text.toString()
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

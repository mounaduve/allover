package de.duve.claudeauto

import android.Manifest
import android.content.pm.PackageManager
import androidx.car.app.CarContext
import androidx.car.app.CarToast
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner

/**
 * Ein Chat mit einer Sitzung: Sprechen → Erkennen → kurz vorlesen → Senden.
 * Die Antwort liest Hub vor, sobald sie da ist – auch wenn der Bildschirm schon gewechselt hat.
 * Titel bleibt gleich, damit Android Auto Zustandswechsel als Aktualisierung zählt.
 */
class ChatScreen(carContext: CarContext, private val session: ChatSession) : Screen(carContext) {
    private enum class State { IDLE, RECORDING, RECOGNIZING, CONFIRM, SENDING }

    private var state = State.IDLE
    private var recognized = ""
    private var note: String? = null
    private var recorder: Recorder? = null
    private val listener = { invalidate() }

    init {
        Hub.addListener(listener)
        lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onDestroy(owner: LifecycleOwner) {
                recorder?.stop()
                Hub.removeListener(listener)
            }
        })
    }

    private fun set(s: State, n: String? = note) { state = s; note = n; invalidate() }

    private fun startRecording() {
        if (carContext.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            carContext.requestPermissions(listOf(Manifest.permission.RECORD_AUDIO)) { granted, _ ->
                if (granted.isNotEmpty()) startRecording()
                else CarToast.makeText(carContext, "Mikrofon nicht erlaubt", CarToast.LENGTH_LONG).show()
            }
            return
        }
        Hub.speaker.stop()
        val rec = Recorder(carContext, Hub.prefs.swapBytes)
        recorder = rec
        set(State.RECORDING, null)
        Hub.io.execute {
            val pcm = try { rec.record() } catch (e: Exception) { null }
            recorder = null
            if (pcm == null || pcm.size < 16000) { // unter einer halben Sekunde
                post { set(State.IDLE, "Nichts gehört.") }
                return@execute
            }
            post { set(State.RECOGNIZING) }
            try {
                val text = Hub.stt.transcribe(pcm)
                post {
                    if (text.isBlank()) set(State.IDLE, "Nichts erkannt.")
                    else {
                        recognized = text
                        set(State.CONFIRM, null)
                        Hub.speaker.speak("Ich schicke: $text")
                    }
                }
            } catch (e: Exception) {
                post { set(State.IDLE, e.message ?: "Spracherkennung fehlgeschlagen.") }
            }
        }
    }

    private fun send() {
        val text = recognized
        set(State.SENDING)
        Hub.speaker.stop()
        Hub.io.execute {
            try {
                // Ab welcher Antwort-ID gewartet wird: die zuletzt bekannte dieser Sitzung
                val after = maxOf(
                    Hub.lastReply[session.id]?.id ?: 0,
                    runCatching { Hub.relay.status().sessions.firstOrNull { it.id == session.id }?.lastReplyId }.getOrNull() ?: session.lastReplyId,
                )
                Hub.relay.send(session.id, text)
                Hub.awaitReply(session.id, session.name, after)
                post { set(State.IDLE, "Gesendet. Ich lese die Antwort vor, sobald sie da ist.") }
            } catch (e: Exception) {
                post { set(State.CONFIRM, "Senden fehlgeschlagen. Nochmal versuchen?") }
            }
        }
    }

    private fun post(r: () -> Unit) = android.os.Handler(android.os.Looper.getMainLooper()).post(r)

    private fun action(title: String, onClick: () -> Unit) =
        Action.Builder().setTitle(title).setOnClickListener(onClick).build()

    override fun onGetTemplate(): Template {
        val waiting = Hub.isWaiting(session.id)
        val (message, actions) = when (state) {
            State.RECORDING -> "Ich höre zu …" to listOf(
                action("Fertig") { recorder?.stop() },
                action("Abbrechen") { recorder?.stop(); set(State.IDLE, "Abgebrochen.") },
            )
            State.RECOGNIZING -> "Erkenne …" to emptyList()
            State.CONFIRM -> ((note?.let { "$it\n" } ?: "") + "„$recognized“") to listOf(
                action("Senden") { send() },
                action("Nochmal") { startRecording() },
            )
            State.SENDING -> "Sende …" to emptyList()
            State.IDLE -> {
                val last = Hub.lastReply[session.id]?.text
                val text = note ?: when {
                    waiting -> "Warte auf Antwort …"
                    last != null -> last.take(300)
                    else -> "Tippe auf Sprechen."
                }
                text to listOfNotNull(
                    action("Sprechen") { startRecording() },
                    if (last != null) action("Vorlesen") { Hub.speaker.speak(last) } else null,
                )
            }
        }
        val b = MessageTemplate.Builder(message.ifBlank { " " })
            .setTitle(session.name)
            .setHeaderAction(Action.BACK)
        actions.forEach { b.addAction(it) }
        return b.build()
    }
}

package de.duve.claudeauto

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.MediaDescriptionCompat
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.media.MediaBrowserServiceCompat

/**
 * Claude im Auto als "Musik-App": Android Auto (ab 17.9) lässt seitlich installierte Apps mit eigenen
 * Bildschirmen nicht zu, Musik-Apps aber schon.
 *
 * - Liste = laufende Sitzungen auf dem Mac (wie Playlists)
 * - Sitzung antippen = auswählen, letzte Antwort wird vorgelesen
 * - Knöpfe im Player: Sprechen → Haken (Fertig) → wird erkannt und sofort gesendet
 * - Vor/Zurück = nächste/vorige Sitzung, Pause = Vorlesen stoppen, Play = letzte Antwort nochmal
 */
class MediaService : MediaBrowserServiceCompat() {
    private enum class Phase { IDLE, RECORDING, RECOGNIZING, CONFIRM, SENDING }

    private lateinit var session: MediaSessionCompat
    private val main = Handler(Looper.getMainLooper())
    private var sessions: List<ChatSession> = emptyList()
    private var macOnline = false
    private var current: ChatSession? = null
    private var phase = Phase.IDLE
    private var recognized = ""
    private var recorder: PhoneRecorder? = null
    private var foreground = false
    private val listener = { updateState() }
    private val refresher = object : Runnable {
        override fun run() { refreshSessions(); main.postDelayed(this, 30_000) }
    }

    override fun onCreate() {
        super.onCreate()
        Hub.init(this)
        session = MediaSessionCompat(this, "ClaudeAuto")
        session.setCallback(callback)
        session.isActive = true
        sessionToken = session.sessionToken
        Hub.addListener(listener)
        main.post(refresher)
        updateState()
        Hub.log("Dienst gestartet")
    }

    override fun onDestroy() {
        main.removeCallbacks(refresher)
        Hub.removeListener(listener)
        recorder?.stop()
        session.release()
        super.onDestroy()
    }

    // ---------- Liste ----------

    override fun onGetRoot(clientPackageName: String, clientUid: Int, rootHints: Bundle?) = BrowserRoot(ROOT, null)

    override fun onLoadChildren(parentId: String, result: Result<MutableList<MediaBrowserCompat.MediaItem>>) {
        val items = mutableListOf<MediaBrowserCompat.MediaItem>()
        val info = when {
            Hub.prefs.deviceToken.isBlank() -> "Nicht gekoppelt – am Handy koppeln"
            !macOnline && sessions.isEmpty() -> "Mac offline oder schläft"
            else -> null
        }
        if (info != null) items += item(INFO_ID, info, "Tippen zum Aktualisieren")
        sessions.forEach { s ->
            val state = when {
                Hub.isWaiting(s.id) -> "wartet auf Antwort"
                s.busy -> "arbeitet"
                else -> "bereit"
            }
            items += item(s.id, s.name, state)
        }
        result.sendResult(items)
    }

    private fun item(id: String, title: String, sub: String) = MediaBrowserCompat.MediaItem(
        MediaDescriptionCompat.Builder().setMediaId(id).setTitle(title).setSubtitle(sub).build(),
        MediaBrowserCompat.MediaItem.FLAG_PLAYABLE,
    )

    private fun refreshSessions() {
        if (Hub.prefs.deviceToken.isBlank()) { notifyChildrenChanged(ROOT); return }
        Hub.io.execute {
            try {
                val st = Hub.relay.status()
                main.post {
                    sessions = st.sessions.take(MAX_SESSIONS); macOnline = st.macOnline
                    current = current?.let { c -> sessions.firstOrNull { it.id == c.id } ?: c }
                    notifyChildrenChanged(ROOT)
                }
            } catch (e: Exception) {
                Hub.log("Sitzungen laden fehlgeschlagen: $e")
                main.post { macOnline = false; notifyChildrenChanged(ROOT) }
            }
        }
    }

    // ---------- Bedienung ----------

    private val callback = object : MediaSessionCompat.Callback() {
        override fun onPlayFromMediaId(mediaId: String?, extras: Bundle?) {
            goForeground()
            if (mediaId == INFO_ID || mediaId == null) { refreshSessions(); Hub.speaker.speak("Aktualisiere."); return }
            val s = sessions.firstOrNull { it.id == mediaId } ?: return
            select(s)
        }

        override fun onPlay() {
            goForeground()
            val c = current ?: sessions.firstOrNull()?.also { select(it); return } ?: return
            val last = Hub.lastReply[c.id]
            Hub.speaker.speak(last?.let { "Letzte Antwort von ${c.name}. ${it.text}" } ?: "Noch keine Antwort von ${c.name}.")
        }

        override fun onPause() { Hub.speaker.stop(); updateState() }

        override fun onStop() {
            Hub.speaker.stop(); recorder?.stop()
            phase = Phase.IDLE
            stopForegroundIfIdle(force = true)
            updateState()
        }

        override fun onSkipToNext() = step(1)
        override fun onSkipToPrevious() = step(-1)

        override fun onCustomAction(action: String?, extras: Bundle?) {
            goForeground()
            when (action) {
                ACTION_SPEAK -> startRecording()
                ACTION_DONE -> recorder?.stop()
                ACTION_SEND -> send()
                ACTION_CANCEL -> { recorder?.stop(); Hub.speaker.stop(); phase = Phase.IDLE; Hub.speaker.speak("Verworfen."); updateState() }
            }
        }
    }

    private fun step(dir: Int) {
        if (sessions.isEmpty()) return
        val i = sessions.indexOfFirst { it.id == current?.id }
        select(sessions[((if (i < 0) 0 else i + dir) % sessions.size + sessions.size) % sessions.size])
    }

    private fun select(s: ChatSession) {
        current = s
        phase = Phase.IDLE
        Hub.speaker.stop()
        updateState()
        Hub.speaker.speak("${s.name}. Tippe auf Sprechen.")
    }

    private fun startRecording() {
        val c = current ?: run { Hub.speaker.speak("Bitte zuerst eine Sitzung wählen."); return }
        if (phase == Phase.RECORDING) return
        Hub.speaker.stop()
        // Erst ansagen, dann aufnehmen – sonst nimmt das Mikrofon die Ansage mit auf
        Hub.speaker.speak("Sprich jetzt.") {
            main.post {
                // Ende nur per Haken (Fertig), keine automatische Pausen-Erkennung – Mouna will Denkpausen machen können
                val rec = PhoneRecorder(this, Hub.prefs.swapBytes, stopOnPause = false)
                recorder = rec
                phase = Phase.RECORDING
                updateState()
                Hub.io.execute { record(rec, c) }
            }
        }
    }

    private fun record(rec: PhoneRecorder, c: ChatSession) {
        val pcm = try { rec.record() } catch (e: Exception) { Hub.log("Aufnahme fehlgeschlagen: $e"); null }
        recorder = null
        Hub.log("Aufnahme ${pcm?.size ?: 0} Bytes über ${rec.micName}")
        if (phase != Phase.RECORDING) return // abgebrochen
        if (pcm == null || pcm.size < 16000) { done("Ich habe nichts gehört."); return }
        main.post { phase = Phase.RECOGNIZING; updateState() }
        try {
            val text = Hub.stt.transcribe(pcm)
            Hub.log("Erkannt (${text.length} Zeichen)")
            main.post {
                if (text.isBlank()) { done("Ich habe nichts verstanden."); return@post }
                // Mouna will nicht bestätigen: Haken = senden, ohne Vorlesen
                recognized = text
                phase = Phase.CONFIRM
                send()
            }
        } catch (e: Exception) {
            Hub.log("Spracherkennung fehlgeschlagen: ${e.message}")
            done("Spracherkennung fehlgeschlagen.")
        }
    }

    private fun send() {
        val c = current ?: return
        if (phase != Phase.CONFIRM) return
        val text = recognized
        phase = Phase.SENDING
        Hub.speaker.stop()
        updateState()
        Hub.io.execute {
            try {
                val after = maxOf(
                    Hub.lastReply[c.id]?.id ?: 0,
                    runCatching { Hub.relay.status().sessions.firstOrNull { it.id == c.id }?.lastReplyId }.getOrNull() ?: c.lastReplyId,
                )
                Hub.relay.send(c.id, text)
                Hub.awaitReply(c.id, c.name, after)
                done("Gesendet.")
            } catch (e: Exception) {
                Hub.log("Senden fehlgeschlagen: $e")
                main.post { phase = Phase.CONFIRM; updateState(); Hub.speaker.speak("Senden fehlgeschlagen. Tippe auf Senden für einen neuen Versuch.") }
            }
        }
    }

    private fun done(say: String) = main.post {
        phase = Phase.IDLE
        updateState()
        Hub.speaker.speak(say)
    }

    // ---------- Anzeige im Player ----------

    private fun updateState() {
        val c = current
        val last = c?.let { Hub.lastReply[it.id]?.text }
        val title = c?.name ?: "Claude"
        val line = when (phase) {
            Phase.RECORDING -> "Ich höre zu …"
            Phase.RECOGNIZING -> "Erkenne …"
            Phase.CONFIRM -> "„$recognized“"
            Phase.SENDING -> "Sende …"
            Phase.IDLE -> when {
                c == null -> "Sitzung wählen"
                Hub.isWaiting(c.id) -> "Warte auf Antwort …"
                last != null -> last.take(200)
                else -> "Tippe auf Sprechen"
            }
        }
        session.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, line)
                .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_SUBTITLE, line)
                .build()
        )
        val active = Hub.speaker.speaking || phase == Phase.RECORDING || phase == Phase.RECOGNIZING || phase == Phase.SENDING
        val b = PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_PLAY_FROM_MEDIA_ID or PlaybackStateCompat.ACTION_STOP or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            )
            .setState(if (active) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED, 0, 1f)
        when (phase) {
            Phase.RECORDING -> {
                b.addCustomAction(ACTION_DONE, "Fertig", R.drawable.ic_done)
                b.addCustomAction(ACTION_CANCEL, "Verwerfen", R.drawable.ic_cancel)
            }
            Phase.CONFIRM -> {
                b.addCustomAction(ACTION_SEND, "Senden", R.drawable.ic_send)
                b.addCustomAction(ACTION_SPEAK, "Nochmal", R.drawable.ic_mic)
                b.addCustomAction(ACTION_CANCEL, "Verwerfen", R.drawable.ic_cancel)
            }
            else -> b.addCustomAction(ACTION_SPEAK, "Sprechen", R.drawable.ic_mic)
        }
        session.setPlaybackState(b.build())
    }

    // ---------- Vordergrunddienst (nötig fürs Mikrofon im Hintergrund) ----------

    private fun goForeground() {
        if (foreground) return
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Claude Auto", NotificationManager.IMPORTANCE_LOW))
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val n = Notification.Builder(this, CHANNEL)
            .setContentTitle("Claude Auto aktiv")
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(open)
            .setStyle(Notification.MediaStyle().setMediaSession(session.sessionToken.token as android.media.session.MediaSession.Token))
            .build()
        try {
            startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
            foreground = true
        } catch (e: Exception) {
            Hub.log("Vordergrunddienst verweigert: $e")
        }
    }

    private fun stopForegroundIfIdle(force: Boolean) {
        if (foreground && (force || phase == Phase.IDLE)) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            foreground = false
        }
    }

    companion object {
        const val ROOT = "root"
        const val INFO_ID = "info"
        const val CHANNEL = "auto"
        const val MAX_SESSIONS = 8
        const val ACTION_SPEAK = "speak"
        const val ACTION_DONE = "done"
        const val ACTION_SEND = "send"
        const val ACTION_CANCEL = "cancel"
    }
}

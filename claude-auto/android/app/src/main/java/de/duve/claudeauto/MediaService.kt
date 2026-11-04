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
 * - ⏭ = Sprechen bzw. Fertig, ⏮ = Verwerfen bzw. letzte Antwort; Pause/Play = anhalten/weiterlesen
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
        override fun run() { refreshSessions(); main.postDelayed(this, 20_000) }
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
                    announceNewReplies(st.sessions)
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

    // ---------- Neue Antworten ansagen ----------

    /** Letzte bekannte Antwort-ID je Sitzung; beim ersten Laden nur merken, nichts ansagen. */
    private val knownReply = mutableMapOf<String, Long>()
    private var baselineDone = false

    /**
     * Mouna will hören, wenn irgendeine Sitzung fertig ist – aber nur angesagt, nicht vorgelesen.
     * Antworten auf Nachrichten aus dem Auto liest Hub ohnehin komplett vor, die zählen hier nicht.
     */
    private fun announceNewReplies(all: List<ChatSession>) {
        for (s in all) {
            val prev = knownReply[s.id]
            knownReply[s.id] = maxOf(prev ?: 0, s.lastReplyId)
            if (!baselineDone || s.lastReplyId <= (prev ?: 0)) continue
            if (Hub.isWaiting(s.id) || (Hub.lastReply[s.id]?.id ?: 0) >= s.lastReplyId) continue
            if (phase == Phase.IDLE) current = s // Play liest dann genau diese Antwort
            Hub.speaker.speak("Neue Antwort von ${s.name}.")
            updateState()
        }
        baselineDone = true
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
            if (Hub.speaker.paused) { Hub.speaker.resume(); return }
            if (Hub.speaker.speaking) return
            val c = current ?: sessions.firstOrNull()?.also { select(it); return } ?: return
            // Neueste Antwort vom Relay holen – auch auf Fragen, die nicht aus dem Auto kamen
            Hub.io.execute {
                val last = runCatching { Hub.relay.waitReply(c.id, 0, wait = 0) }.getOrNull()
                    ?.also { Hub.lastReply[c.id] = it } ?: Hub.lastReply[c.id]
                main.post {
                    Hub.speaker.speak(last?.let { "Antwort von ${c.name}. ${it.text}" } ?: "Noch keine Antwort von ${c.name}.")
                    updateState()
                }
            }
        }

        override fun onPause() { Hub.speaker.pause(); updateState() }

        override fun onStop() {
            Hub.speaker.stop(); recorder?.stop()
            phase = Phase.IDLE
            stopForegroundIfIdle(force = true)
            updateState()
        }

        // ⏭/⏮ sind umbelegt, weil die kleine Ansicht (Split Screen) und das Lenkrad nur diese Knöpfe haben:
        // ⏭ = Sprechen, beim Sprechen = Fertig und senden; ⏮ = beim Sprechen Verwerfen, sonst letzte Antwort nochmal
        override fun onSkipToNext() {
            goForeground()
            if (phase == Phase.RECORDING) finishRecording() else startRecording()
        }

        override fun onSkipToPrevious() {
            goForeground()
            if (phase == Phase.RECORDING) cancelRecording() else { Hub.speaker.stop(); onPlay() }
        }

        override fun onCustomAction(action: String?, extras: Bundle?) {
            goForeground()
            when (action) {
                ACTION_SPEAK -> startRecording()
                ACTION_DONE -> finishRecording()
                ACTION_SEND -> send()
                ACTION_CANCEL -> cancelRecording()
            }
        }
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
        // Kurzer Ton statt Ansage (schneller); erst danach aufnehmen, damit der Ton nicht mit drauf ist
        beep()
        main.postDelayed({
            // Ende nur per Haken/⏭ (Fertig), keine automatische Pausen-Erkennung – Mouna will Denkpausen machen können
            val rec = PhoneRecorder(this, Hub.prefs.swapBytes, stopOnPause = false)
            recorder = rec
            phase = Phase.RECORDING
            updateState()
            Hub.io.execute { record(rec, c) }
        }, 250)
    }

    private val tones by lazy { android.media.ToneGenerator(android.media.AudioManager.STREAM_MUSIC, 90) }
    private fun beep(double: Boolean = false) {
        tones.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, 150)
        if (double) main.postDelayed({ tones.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, 150) }, 220)
    }

    /** Fertig: Aufnahme beenden (danach wird erkannt und gesendet), mit Doppelton als Bestätigung. */
    private fun finishRecording() {
        if (phase != Phase.RECORDING) return
        recorder?.stop()
        beep(double = true)
    }

    private fun cancelRecording() {
        recorder?.stop(); Hub.speaker.stop(); phase = Phase.IDLE
        Hub.speaker.speak("Verworfen."); updateState()
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
                Hub.lastSent[c.id] = text
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

    /** App-Symbol als „Cover“, damit keine leere graue Fläche erscheint. */
    private val art: android.graphics.Bitmap by lazy {
        val d = getDrawable(R.drawable.ic_claude_auto)!!
        val b = android.graphics.Bitmap.createBitmap(320, 320, android.graphics.Bitmap.Config.ARGB_8888)
        val c = android.graphics.Canvas(b)
        c.drawColor(0xFF2B2522.toInt())
        d.setBounds(40, 40, 280, 280); d.draw(c)
        b
    }

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
                Hub.isWaiting(c.id) -> "Gesendet: „${Hub.lastSent[c.id] ?: ""}“ – warte auf Antwort …"
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
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, if (Hub.speaker.speaking) Hub.speaker.durationMs else 0L)
                .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, art)
                .putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, art)
                .build()
        )
        val active = (Hub.speaker.speaking && !Hub.speaker.paused) || phase == Phase.RECORDING || phase == Phase.RECOGNIZING || phase == Phase.SENDING
        val b = PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_PLAY_FROM_MEDIA_ID or PlaybackStateCompat.ACTION_STOP or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            )
            .setState(
                if (active) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED,
                if (Hub.speaker.speaking) Hub.speaker.positionMs() else 0L,
                if (active && Hub.speaker.speaking) 1f else 0f,
            )
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

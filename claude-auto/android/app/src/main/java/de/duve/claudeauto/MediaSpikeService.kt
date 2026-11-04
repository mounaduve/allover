package de.duve.claudeauto

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.ServiceInfo
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Bundle
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.media.MediaBrowserServiceCompat
import kotlin.math.sqrt

/** Testdienst: Prüft, ob Android Auto eine Musik-App zeigt und ob sie im Hintergrund aufnehmen darf. */
class MediaSpikeService : MediaBrowserServiceCompat() {
    private lateinit var session: MediaSessionCompat

    override fun onCreate() {
        super.onCreate()
        session = MediaSessionCompat(this, "ClaudeAuto")
        session.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY or PlaybackStateCompat.ACTION_PAUSE)
                .setState(PlaybackStateCompat.STATE_PAUSED, 0, 1f).build()
        )
        session.setCallback(object : MediaSessionCompat.Callback() {
            override fun onPlay() { Log.i(TAG, "onPlay"); recordTest() }
        })
        session.isActive = true
        sessionToken = session.sessionToken
        Log.i(TAG, "created")
    }

    private fun recordTest() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel("auto", "Claude Auto", NotificationManager.IMPORTANCE_LOW))
        val n = Notification.Builder(this, "auto").setContentTitle("Claude Auto")
            .setSmallIcon(R.drawable.ic_claude_auto).build()
        try {
            startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
            Log.i(TAG, "startForeground ok")
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed: $e")
            return
        }
        Thread {
            try {
                val min = AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
                val rec = AudioRecord(MediaRecorder.AudioSource.VOICE_COMMUNICATION, 16000,
                    AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, min * 4)
                rec.startRecording()
                val buf = ShortArray(1600)
                for (i in 0 until 20) {
                    val n2 = rec.read(buf, 0, buf.size)
                    var s = 0.0
                    for (j in 0 until maxOf(n2, 0)) s += buf[j] * buf[j].toDouble()
                    Log.i(TAG, "read=$n2 rms=${if (n2 > 0) sqrt(s / n2).toInt() else -1}")
                }
                rec.stop(); rec.release()
            } catch (e: Exception) {
                Log.e(TAG, "record failed: $e")
            } finally {
                stopForeground(STOP_FOREGROUND_REMOVE)
            }
        }.start()
    }

    override fun onGetRoot(clientPackageName: String, clientUid: Int, rootHints: Bundle?) = BrowserRoot("root", null)

    override fun onLoadChildren(parentId: String, result: Result<MutableList<MediaBrowserCompat.MediaItem>>) {
        result.sendResult(mutableListOf())
    }

    override fun onDestroy() { session.release(); super.onDestroy() }

    companion object { const val TAG = "ClaudeAutoSpike" }
}

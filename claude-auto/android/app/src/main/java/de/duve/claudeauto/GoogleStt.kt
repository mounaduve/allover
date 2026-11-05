package de.duve.claudeauto

import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Kostenlose Spracherkennung über die Google-Erkennung auf dem Handy.
 * Bekommt die schon aufgenommene Aufnahme (16 kHz, 16 Bit, mono) über eine Pipe statt selbst das Mikrofon zu öffnen –
 * so bleiben Automikrofon, Pausen-Erkennung und Ablauf genau wie bei ElevenLabs (geht ab Android 13).
 */
class GoogleStt(private val context: Context) {
    private val main = Handler(Looper.getMainLooper())

    /** Blockiert; im Hintergrund-Thread aufrufen. */
    fun transcribe(pcm: ByteArray): String {
        val done = CountDownLatch(1)
        val parts = mutableListOf<String>()
        var error: Int? = null
        var recognizer: SpeechRecognizer? = null
        val pipe = ParcelFileDescriptor.createPipe()

        val listener = object : RecognitionListener {
            override fun onSegmentResults(b: Bundle) { best(b)?.let { synchronized(parts) { parts += it } } }
            override fun onEndOfSegmentedSession() { done.countDown() }
            override fun onResults(b: Bundle) { best(b)?.let { synchronized(parts) { parts += it } }; done.countDown() }
            override fun onError(code: Int) {
                // „Nichts erkannt“ ist kein Fehler, sondern einfach leerer Text
                if (code != SpeechRecognizer.ERROR_NO_MATCH && code != SpeechRecognizer.ERROR_SPEECH_TIMEOUT) error = code
                done.countDown()
            }
            override fun onReadyForSpeech(p: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(b: Bundle?) {}
            override fun onEvent(t: Int, b: Bundle?) {}
        }

        main.post {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(context)) { error = -1; done.countDown(); return@post }
                val sr = SpeechRecognizer.createSpeechRecognizer(context)
                recognizer = sr
                sr.setRecognitionListener(listener)
                sr.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "de-DE")
                    putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, pipe[0])
                    putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, AudioFormat.ENCODING_PCM_16BIT)
                    putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1)
                    putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, PhoneRecorder.RATE)
                    // Erst am Ende der Aufnahme fertig sein – sonst bricht die Erkennung bei der ersten Denkpause ab
                    putExtra(RecognizerIntent.EXTRA_SEGMENTED_SESSION, RecognizerIntent.EXTRA_AUDIO_SOURCE)
                })
            } catch (e: Exception) {
                Hub.log("Google-Erkennung startet nicht: $e"); error = -2; done.countDown()
            }
        }

        try {
            ParcelFileDescriptor.AutoCloseOutputStream(pipe[1]).use { out ->
                var i = 0
                while (i < pcm.size) {
                    val n = minOf(6400, pcm.size - i)
                    out.write(pcm, i, n); i += n
                }
            }
        } catch (e: Exception) {
            Hub.log("Google-Erkennung: Aufnahme übergeben fehlgeschlagen: $e")
        }

        val finished = done.await(90, TimeUnit.SECONDS)
        main.post { runCatching { recognizer?.destroy() }; runCatching { pipe[0].close() } }
        if (!finished) throw HttpException(0, "Google-Erkennung: keine Antwort")
        error?.let { throw HttpException(it, "Google-Erkennung: Fehler $it") }
        return synchronized(parts) { parts.joinToString(" ") }.trim()
    }

    private fun best(b: Bundle): String? =
        b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.takeIf { it.isNotBlank() }
}

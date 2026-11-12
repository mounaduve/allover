package de.duve.claudeauto

import android.content.Intent
import androidx.car.app.CarAppService
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.ItemList
import androidx.car.app.model.ListTemplate
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.car.app.validation.HostValidator

class AutoService : CarAppService() {
    // Seitlich installierte Eigenbau-App: jeder Android-Auto-Host darf sie öffnen.
    override fun createHostValidator(): HostValidator = HostValidator.ALLOW_ALL_HOSTS_VALIDATOR

    override fun onCreateSession(): Session = object : Session() {
        override fun onCreateScreen(intent: Intent): Screen {
            Hub.init(carContext)
            return SessionListScreen(carContext)
        }
    }
}

/** Startbildschirm: Liste der laufenden Claude-Sitzungen auf dem Mac. */
class SessionListScreen(carContext: CarContext) : Screen(carContext) {
    private var status: Status? = null
    private var error: String? = null
    private var loading = false
    private val listener = { invalidate() }

    init {
        Hub.addListener(listener)
        lifecycle.addObserver(object : androidx.lifecycle.DefaultLifecycleObserver {
            override fun onStart(owner: androidx.lifecycle.LifecycleOwner) = load()
            override fun onDestroy(owner: androidx.lifecycle.LifecycleOwner) = Hub.removeListener(listener)
        })
    }

    private fun load() {
        if (loading) return
        loading = true
        Hub.io.execute {
            try {
                status = Hub.relay.status(); error = null
            } catch (e: HttpException) {
                error = if (e.code == 401) "Nicht gekoppelt. Bitte am Handy die App öffnen und koppeln." else "Relay-Fehler ${e.code}"
            } catch (e: Exception) {
                error = "Keine Verbindung zum Relay."
            }
            loading = false
            Hub.changed()
        }
    }

    override fun onGetTemplate(): Template {
        val refresh = ActionStrip.Builder()
            .addAction(Action.Builder().setTitle("Aktualisieren").setOnClickListener { load() }.build())
            .build()
        val err = error
        if (Hub.prefs.deviceToken.isBlank() || err != null) {
            return MessageTemplate.Builder(err ?: "Nicht gekoppelt. Bitte am Handy die App öffnen und koppeln.")
                .setTitle("Claude")
                .addAction(Action.Builder().setTitle("Nochmal").setOnClickListener { load() }.build())
                .build()
        }
        val st = status ?: return ListTemplate.Builder().setTitle("Claude").setLoading(true).build()
        val items = ItemList.Builder()
        if (!st.macOnline) {
            items.setNoItemsMessage("Mac schläft oder ist offline.")
        } else {
            items.setNoItemsMessage("Keine laufenden Sitzungen.")
            st.sessions.take(MAX_ROWS).forEach { s ->
                val state = Hub.stateLabel(s)
                items.addItem(
                    Row.Builder().setTitle(s.name).addText(state)
                        .setOnClickListener { screenManager.push(ChatScreen(carContext, s)) }
                        .build()
                )
            }
        }
        return ListTemplate.Builder()
            .setTitle(if (st.macOnline) "Claude – Mac" else "Claude – Mac offline")
            .setSingleList(items.build())
            .setActionStrip(refresh)
            .build()
    }

    companion object { const val MAX_ROWS = 6 }
}


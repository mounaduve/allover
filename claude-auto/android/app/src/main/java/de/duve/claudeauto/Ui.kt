package de.duve.claudeauto

import android.app.Activity
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Switch
import android.widget.TextView

/** Claude-Look aus dem Entwurf in Claude Design: warmes Off-White, Schiefer, Ton-Orange. */
object C {
    const val IVORY = 0xFFFAF9F5.toInt()
    const val SLATE = 0xFF141413.toInt()
    const val TEXT2 = 0xFF3D3D3A.toInt()
    const val GREY = 0xFF5E5D59.toInt()
    const val MUTED = 0xFF8C887D.toInt()
    const val CLAY = 0xFFC15F3C.toInt()
    const val CLAY_LIGHT = 0xFFD97757.toInt()
    const val LABEL = 0xFF8A5A44.toInt()
    const val BORDER = 0xFFE6E3DA.toInt()
    const val BORDER2 = 0xFFD9D5CA.toInt()
    const val DIVIDER = 0xFFF0EDE5.toInt()
    const val DOCK = 0xFFF3F0E8.toInt()
    const val BUBBLE = 0xFFF0E6DE.toInt()
    const val GREEN = 0xFF3F8F5A.toInt()
    const val WHITE = 0xFFFFFFFF.toInt()
}

val SERIF: Typeface = Typeface.create("serif", Typeface.BOLD)
val SERIF_REGULAR: Typeface = Typeface.create("serif", Typeface.NORMAL)

fun Context.dp(v: Number): Int = (v.toFloat() * resources.displayMetrics.density).toInt()

fun Context.rounded(color: Int, radiusDp: Number, strokeColor: Int = 0, strokeDp: Number = 0) = GradientDrawable().apply {
    setColor(color)
    cornerRadius = dp(radiusDp).toFloat()
    if (strokeDp.toFloat() > 0) setStroke(dp(strokeDp), strokeColor)
}

fun Context.oval(color: Int, strokeColor: Int = 0, strokeDp: Number = 0) = GradientDrawable().apply {
    shape = GradientDrawable.OVAL
    setColor(color)
    if (strokeDp.toFloat() > 0) setStroke(dp(strokeDp), strokeColor)
}

/** Hintergrund mit Antipp-Welle. */
fun View.pressable(bg: android.graphics.drawable.Drawable) {
    background = RippleDrawable(ColorStateList.valueOf(0x22141413), bg, null)
    isClickable = true
    isFocusable = true
}

fun Context.text(t: CharSequence, sizeSp: Float, color: Int = C.SLATE, bold: Boolean = false, serif: Boolean = false) =
    TextView(this).apply {
        text = t
        textSize = sizeSp
        setTextColor(color)
        typeface = when {
            serif && bold -> SERIF
            serif -> SERIF_REGULAR
            bold -> Typeface.DEFAULT_BOLD
            else -> Typeface.DEFAULT
        }
    }

fun Context.icon(res: Int, tint: Int, sizeDp: Int) = ImageView(this).apply {
    setImageResource(res)
    imageTintList = ColorStateList.valueOf(tint)
    layoutParams = LinearLayout.LayoutParams(dp(sizeDp), dp(sizeDp))
}

/** Runder Knopf mit Symbol (z. B. Pause, Stopp). */
fun Context.circleButton(res: Int, sizeDp: Int, iconDp: Int, bg: Int, tint: Int, desc: String, border: Int = 0) =
    FrameLayout(this).apply {
        pressable(oval(bg, border, if (border != 0) 1 else 0))
        contentDescription = desc
        addView(icon(res, tint, iconDp), FrameLayout.LayoutParams(dp(iconDp), dp(iconDp), Gravity.CENTER))
        layoutParams = LinearLayout.LayoutParams(dp(sizeDp), dp(sizeDp))
    }

/** Pillen-Knopf; `dark` = gefüllt in Schiefer. */
fun Context.pill(label: String, dark: Boolean = false, onClick: () -> Unit) = TextView(this).apply {
    text = label
    textSize = 14f
    gravity = Gravity.CENTER
    minHeight = dp(44)
    setPadding(dp(16), 0, dp(16), 0)
    typeface = Typeface.create(Typeface.DEFAULT, if (dark) Typeface.BOLD else Typeface.NORMAL)
    setTextColor(if (dark) C.IVORY else C.SLATE)
    pressable(if (dark) rounded(C.SLATE, 22) else rounded(C.IVORY, 22, C.BORDER2, 1))
    setOnClickListener { onClick() }
}

/** Abschnitt mit grauer Großbuchstaben-Überschrift und weißer Karte; liefert die Karte. */
fun Context.section(parent: LinearLayout, title: String, padded: Boolean = true): LinearLayout {
    parent.addView(text(title.uppercase(), 12f, C.GREY, bold = true).apply {
        letterSpacing = 0.08f
        setPadding(dp(4), dp(20), dp(4), dp(8))
    })
    val card = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        background = rounded(C.WHITE, 16, C.BORDER, 1)
        if (padded) setPadding(dp(16), dp(16), dp(16), dp(16))
    }
    parent.addView(card, LinearLayout.LayoutParams(-1, -2))
    return card
}

fun Context.styledSwitch(checked: Boolean) = Switch(this).apply {
    isChecked = checked
    val states = arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf())
    thumbTintList = ColorStateList(states, intArrayOf(C.WHITE, C.WHITE))
    trackTintList = ColorStateList(states, intArrayOf(C.CLAY, C.BORDER2))
}

/** Zeile mit Titel, Unterzeile und Schalter; die ganze Zeile ist antippbar. */
fun Context.switchRow(card: LinearLayout, title: String, sub: String?, checked: Boolean, divider: Boolean, onChange: (Boolean) -> Unit): Switch {
    val sw = styledSwitch(checked)
    val row = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        minimumHeight = dp(56)
        setPadding(dp(16), dp(12), dp(16), dp(12))
        pressable(rounded(C.WHITE, 16))
        setOnClickListener { sw.isChecked = !sw.isChecked }
    }
    val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
    col.addView(text(title, 16f))
    if (sub != null) col.addView(text(sub, 13f, C.GREY))
    row.addView(col, LinearLayout.LayoutParams(0, -2, 1f))
    row.addView(sw)
    sw.setOnCheckedChangeListener { _, on -> onChange(on) }
    card.addView(row)
    if (divider) card.addView(View(this).apply { setBackgroundColor(C.DIVIDER) }, LinearLayout.LayoutParams(-1, dp(1)))
    return sw
}

/** Statusleiste hell im Claude-Look. */
fun Activity.ivoryBars() {
    window.statusBarColor = C.IVORY
    window.navigationBarColor = C.IVORY
    @Suppress("DEPRECATION")
    window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
}

/** Pegelanzeige beim Zuhören: Balken laufen von rechts nach links mit der Lautstärke. */
class LevelBars(context: Context, private val level: () -> Double) : View(context) {
    private val values = DoubleArray(24)
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = C.CLAY_LIGHT }
    private val rect = RectF()
    private val main = Handler(Looper.getMainLooper())
    private val tick = object : Runnable {
        override fun run() {
            System.arraycopy(values, 1, values, 0, values.size - 1)
            values[values.size - 1] = (level() / 3000.0).coerceIn(0.0, 1.0)
            invalidate()
            main.postDelayed(this, 80)
        }
    }

    override fun onAttachedToWindow() { super.onAttachedToWindow(); main.post(tick) }
    override fun onDetachedFromWindow() { main.removeCallbacks(tick); super.onDetachedFromWindow() }

    override fun onDraw(canvas: Canvas) {
        val w = context.dp(4).toFloat()
        val gap = context.dp(4).toFloat()
        val total = values.size * w + (values.size - 1) * gap
        var x = (width - total) / 2
        for (v in values) {
            val h = maxOf(w * 2, (height * (0.15 + 0.85 * v)).toFloat())
            rect.set(x, (height - h) / 2, x + w, (height + h) / 2)
            canvas.drawRoundRect(rect, w / 2, w / 2, paint)
            x += w + gap
        }
    }
}

fun ViewGroup.MarginLayoutParams.margins(l: Int = 0, t: Int = 0, r: Int = 0, b: Int = 0) = apply { setMargins(l, t, r, b) }

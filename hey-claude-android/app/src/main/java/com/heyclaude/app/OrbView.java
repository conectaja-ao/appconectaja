package com.heyclaude.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.util.AttributeSet;
import android.view.View;

/** A "bolinha" do assistente: pulsa com a voz, roda a pensar, ondula a falar. */
public class OrbView extends View {
    enum State { LISTENING, THINKING, SPEAKING, IDLE }

    private static final int[][] COLORS = {
            {0xFF4DD0E1, 0xFF00897B},  // a ouvir
            {0xFFB39DDB, 0xFF5E35B1},  // a pensar
            {0xFFFFAB91, 0xFFE64A19},  // a falar
            {0xFFB0BEC5, 0xFF546E7A},  // parado
    };

    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint arc = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF arcBounds = new RectF();
    private State state = State.IDLE;
    private float targetLevel;
    private float level;
    private final long start = System.currentTimeMillis();

    public OrbView(Context context, AttributeSet attrs) {
        super(context, attrs);
        arc.setStyle(Paint.Style.STROKE);
        arc.setStrokeCap(Paint.Cap.ROUND);
        arc.setColor(0xFFFFFFFF);
    }

    void setState(State state) {
        this.state = state;
        invalidate();
    }

    /** Volume do microfone, em dB (SpeechRecognizer.onRmsChanged: mais ou menos -2 a 10). */
    void setRms(float rmsDb) {
        targetLevel = Math.max(0f, Math.min(1f, (rmsDb + 2f) / 12f));
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float t = (System.currentTimeMillis() - start) / 1000f;
        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        float base = Math.min(cx, cy) * 0.62f;
        level += (targetLevel - level) * 0.25f;

        float pulse;
        switch (state) {
            case LISTENING:
                pulse = 0.04f * (float) Math.sin(t * 3) + 0.3f * level;
                break;
            case SPEAKING:
                pulse = 0.08f * (float) Math.abs(Math.sin(t * 7));
                break;
            case THINKING:
                pulse = 0.05f * (float) Math.sin(t * 2);
                break;
            default:
                pulse = 0;
        }
        int[] c = COLORS[state.ordinal()];
        float r = base * (1 + pulse);

        glow.setShader(new RadialGradient(cx, cy, r * 1.6f,
                new int[]{c[0] & 0x66FFFFFF, 0x00000000}, null, Shader.TileMode.CLAMP));
        canvas.drawCircle(cx, cy, r * 1.6f, glow);

        fill.setShader(new RadialGradient(cx - r * 0.3f, cy - r * 0.3f, r * 1.4f,
                c[0], c[1], Shader.TileMode.CLAMP));
        canvas.drawCircle(cx, cy, r, fill);

        if (state == State.THINKING) {
            arc.setStrokeWidth(base * 0.08f);
            arcBounds.set(cx - r * 0.75f, cy - r * 0.75f, cx + r * 0.75f, cy + r * 0.75f);
            canvas.drawArc(arcBounds, (t * 360) % 360, 90, false, arc);
        }
        if (state != State.IDLE || Math.abs(targetLevel - level) > 0.01f) {
            postInvalidateOnAnimation();
        }
    }
}

package br.com.epx.andro12c;

import android.content.res.Resources;
import android.os.Handler;
import android.util.Log;
import android.widget.Toast;

public class JavascriptEngine {
    AndroActivity observer;
    JavascriptEngineThread t;
    Handler h;

    public final String TAG = "androcalc";

    public JavascriptEngine(AndroActivity observer, boolean free_version) {
        this.observer = observer;
        h = new Handler();
        t = new JavascriptEngineThread(this, free_version);
        t.start();
    }

    public void reset(boolean portrait) {
        t.g_reset(portrait);
    }

    public void start() {
        t.g_start();
    }

    public void die() {
        t.g_die();
    }

    public void reload() {
        t.g_reload();
    }

    public void touch(double x, double y) {
        t.g_touch(x, y);
    }

    public void separator(int separator) {
        t.g_separator(separator);
    }

    public void visual_feedback(boolean is_fb) {
        t.g_visual_feedback(is_fb);
    }

    public void rapid(boolean is_rapid) {
        t.g_rapid(is_rapid);
    }

    public void forceSaveMemory() {
        t.g_forceSaveMemory();
    }

    public void g_setAnnunciator(final String name, final String txt) {
        h.post(new Runnable() {
            public void run() {
                setAnnunciator(name, txt);
            }
        });
    }

    private void setAnnunciator(String name, String txt) {
        observer.setAnnunciator(name, txt);
    }

    public void g_setSegment(final int i, final int j, final boolean visibility) {
        h.post(new Runnable() {
            public void run() {
                setSegment(i, j, visibility);
            }
        });
    }

    private void setSegment(int i, int j, boolean visibility) {
        observer.setSegment(i, j, visibility);
    }

    public void g_makeDiv(final float x, final float y, final float w, final float he, final float r, final String type) {
        h.post(new Runnable() {
            public void run() {
                makeDiv(x, y, w, he, r, type);
            }
        });
    }


    private void makeDiv(final float x, final float y, final float w, final float h, final float r, final String type) {
        // observer.makeDiv(x, y, w, h, r, type);
    }

    public void g_clearDiv() {
        h.post(new Runnable() {
            public void run() {
                clearDiv();
            }
        });
    }

    private void clearDiv() {
        // observer.clearDiv();
    }

    public void g_alert(final String text) {
        h.post(new Runnable() {
            public void run() {
                alert(text);
            }
        });
    }

    private void alert(String text) {
        Toast.makeText(observer, "Alert JS:" + text, Toast.LENGTH_SHORT).show();
        Log.w(TAG, "Alert: " + text);
    }

    public void g_keyON() {
        h.post(new Runnable() {
            public void run() {
                keyON();
            }
        });
    }

    private void keyON() {
        observer.keyON();
    }

    public void g_lcd_left() {
        h.post(new Runnable() {
            public void run() {
                lcd_left();
            }
        });
    }

    private void lcd_left() {
        observer.lcd_left();
    }

    public void g_lcd_right() {
        h.post(new Runnable() {
            public void run() {
                lcd_right();
            }
        });
    }

    private void lcd_right() {
        observer.lcd_right();
    }

    public String g_retrieveMemory() {
        /* AndroActivity.retrieveMemory() is thread-safe */
        return observer.retrieveMemory();
    }

    public void g_saveMemory(final String s) {
        h.post(new Runnable() {
            public void run() {
                saveMemory(s);
            }
        });
    }

    private void saveMemory(String s) {
        observer.saveMemory(s);
    }

    public void g_openMenu() {
        h.post(new Runnable() {
            public void run() {
                openMenu();
            }
        });
    }

    private void openMenu() {
        observer.openOptionsMenu();
    }

    public void g_touchFeedback() {
        h.post(new Runnable() {
            public void run() {
                touchFeedback();
            }
        });
    }

    private void touchFeedback() {
        observer.touchFeedback();
    }

    public void g_thread_ready() {
        h.post(new Runnable() {
            public void run() {
                thread_ready();
            }
        });
    }

    private void thread_ready() {
        observer.engine_ready();
    }

    public Resources getResources() {
        return observer.getResources();
    }
}

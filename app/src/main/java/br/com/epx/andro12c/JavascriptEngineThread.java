package br.com.epx.andro12c;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.SparseIntArray;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class JavascriptEngineThread extends Thread {
    JavascriptEngine observer;
    Context rhino;
    Scriptable scope;
    Script main_engine;
    Script engine_patch;
    String src;
    String src_patch;
    String src_prepatch;
    Handler h;
    boolean started = false;
    boolean free_version;

    public final String TAG = "androcalc";

    SparseIntArray timeout_handles;

    public JavascriptEngineThread(JavascriptEngine observer, boolean free_version) {
        this.observer = observer;
        this.free_version = free_version;
    }

    @Override
    public void run() {
        Log.d(TAG, "Engine thread started");

        Looper.prepare();
        h = new Handler();
        observer.g_thread_ready();

        rhino = Context.enter();
        rhino.setOptimizationLevel(-1);
        h = new Handler();
        try {
            src = getResource(R.raw.engine);
            src_patch = getResource(R.raw.patch);
            src_prepatch = getResource(R.raw.patch_pre);
        } catch (IOException e) {
            Log.e(TAG, "Could not read Javascript engine source");
        }

        timeout_handles = new SparseIntArray();
        scope = rhino.initStandardObjects();
        Object this_js = Context.javaToJS(this, scope);
        ScriptableObject.putProperty(scope, "gateway", this_js);

        rhino.evaluateString(scope, src_prepatch, "prepatch", 1, null);
        rhino.evaluateString(scope, src, "engine", 1, null);
        rhino.evaluateString(scope, src_patch, "patch", 1, null);

        Scriptable H = (Scriptable) scope.get("H", scope);
        ScriptableObject.putProperty(H, "embedded", Context.javaToJS(true, scope));
        ScriptableObject.putProperty(scope, "is_this_free_version", Context.javaToJS(free_version, scope));

        started = false;

        Looper.loop();

        Log.d(TAG, "Engine thread died");
    }

    public void g_reset(final boolean portrait) {
        h.post(new Runnable() {
            public void run() {
                reset(portrait);
            }
        });
    }

    private void reset(boolean portrait) {
        double disp_theo_width, disp_theo_height;
        double disp_key_offset_x, disp_key_offset_y;
        double disp_key_width, disp_key_height;
        double disp_key_dist_x, disp_key_dist_y;

        // remember that there are coordinates in Activity
        // FIXME increase targets for keys
        if (portrait) {
            disp_theo_width = 1080;
            disp_theo_height = 1726;
            disp_key_dist_x = 918.0 / 5.0;
            disp_key_dist_y = 1214.0 / 6.0;
            disp_key_offset_x = 11 - (disp_key_dist_x - 139) / 2;
            disp_key_offset_y = 380 - (disp_key_dist_y - 124) / 2;
            disp_key_width = disp_key_dist_x - 1;
            disp_key_height = disp_key_dist_y - 1;
        } else {
            disp_theo_width = 1757;
            disp_theo_height = 1080;
            disp_key_dist_x = 1598.0 / 9.0;
            disp_key_dist_y = 588.0 / 3.0;
            disp_key_offset_x = 13 - (disp_key_dist_x - 132) / 2;
            disp_key_offset_y = 360 - (disp_key_dist_x - 118) / 2;
            disp_key_width = disp_key_dist_x - 1;
            disp_key_height = disp_key_dist_y - 1;
        }

        Scriptable H = (Scriptable) scope.get("H", scope);
        ScriptableObject.putProperty(H, "vertical_layout", Context.javaToJS(portrait, scope));
        ScriptableObject.putProperty(H, "disp_theo_width", Context.javaToJS(disp_theo_width, scope));
        ScriptableObject.putProperty(H, "disp_theo_height", Context.javaToJS(disp_theo_height, scope));
        ScriptableObject.putProperty(H, "disp_key_offset_x", Context.javaToJS(disp_key_offset_x, scope));
        ScriptableObject.putProperty(H, "disp_key_offset_y", Context.javaToJS(disp_key_offset_y, scope));
        ScriptableObject.putProperty(H, "disp_key_width", Context.javaToJS(disp_key_width, scope));
        ScriptableObject.putProperty(H, "disp_key_height", Context.javaToJS(disp_key_height, scope));
        ScriptableObject.putProperty(H, "disp_theo_width", Context.javaToJS(disp_theo_width, scope));
        ScriptableObject.putProperty(H, "disp_key_dist_x", Context.javaToJS(disp_key_dist_x, scope));
        ScriptableObject.putProperty(H, "disp_key_dist_y", Context.javaToJS(disp_key_dist_y, scope));

        if (!started) {
            started = true;
            calc_start();
        }
    }

    public void g_start() {
        h.post(new Runnable() {
            public void run() {
                calc_start();
            }
        });
    }

    private void calc_start() {
        Function f = (Function) scope.get("Init_hp12c", scope);
        exec(f, new Object[0]);
    }

    public void g_reload() {
        h.post(new Runnable() {
            public void run() {
                reload();
            }
        });
    }

    private void reload() {
        // currently it is the same as start(), but could be different
        // in the future
        if (started) {
            calc_start();
        }
    }

    public void g_die() {
        h.post(new Runnable() {
            public void run() {
                die();
            }
        });
    }

    private void die() {
        Looper.myLooper().quit();
    }


    public void g_touch(final double x, final double y) {
        h.post(new Runnable() {
            public void run() {
                touch(x, y);
            }
        });
    }

    private void touch(double x, double y) {
        Function f = (Function) scope.get("touchCB", scope);
        Object[] params = new Object[]{x, y};
        exec(f, params);
    }

    public void g_separator(final int separator) {
        h.post(new Runnable() {
            public void run() {
                separator(separator);
            }
        });
    }

    private void separator(int separator) {
        Function f = (Function) scope.get("setSeparator", scope);
        Object[] params = new Object[]{separator};
        exec(f, params);
    }

    public void g_visual_feedback(final boolean is_fb) {
        h.post(new Runnable() {
            public void run() {
                visual_feedback(is_fb);
            }
        });
    }

    private void visual_feedback(boolean is_fb) {
        Function f = (Function) scope.get("visualFeedback", scope);
        Object[] params = new Object[]{is_fb};
        exec(f, params);
    }

    public void g_rapid(final boolean is_rapid) {
        h.post(new Runnable() {
            public void run() {
                rapid(is_rapid);
            }
        });
    }

    private void rapid(boolean is_rapid) {
        Function f = (Function) scope.get("setRapid", scope);
        Object[] params = new Object[]{is_rapid};
        exec(f, params);
    }

    public void g_forceSaveMemory() {
        h.post(new Runnable() {
            public void run() {
                forceSaveMemory();
            }
        });
    }

    private void forceSaveMemory() {
        Function f = (Function) scope.get("forceSaveMemory", scope);
        Object[] params = new Object[]{};
        exec(f, params);
    }

    /* called by Javascript */

    public void keyON() {
        observer.g_keyON();
    }

    public void lcd_left() {
        observer.g_lcd_left();
    }

    public void lcd_right() {
        observer.g_lcd_right();
    }

    public String retrieveMemory() {
        return observer.g_retrieveMemory();
    }

    public void saveMemory(String s) {
        observer.g_saveMemory(s);
    }

    public void openMenu() {
        observer.g_openMenu();
    }

    public void touchFeedback() {
        observer.g_touchFeedback();
    }

    public void JS_setInnerHTML(String name, String txt) {
        observer.g_setAnnunciator(name, txt);
    }

    public void JS_showDisplay(int[] buffer) {
        for (int i = 0; i < buffer.length; ++i) {
            for (int j = 1; j <= 9; ++j) {
                boolean visibility = (buffer[i] & (1 << (j - 1))) != 0;
                observer.g_setSegment(i, j, visibility);
            }
        }
    }

    public void JS_makeDiv(float x, float y, float w, float h, float r, String type) {
        observer.g_makeDiv(x, y, w, h, r, type);
    }

    public void JS_clearDiv() {
        observer.g_clearDiv();
    }

    public void JS_setTimeout(final int milisseconds, final int handle) {
        // Log.d(TAG, "setTimeout " + milisseconds + " " + handle);
        if (-2 != timeout_handles.get(handle, -2)) {
            Log.w(TAG, "timeout with handle " + handle + " already exists");
        }
        timeout_handles.put(handle, 0);
        callLater(handle, milisseconds);
    }

    public void JS_clearTimeout(int handle) {
        // Log.d(TAG, "clearTimeout " + handle);
        if (-2 != timeout_handles.get(handle, -2)) {
            timeout_handles.put(handle, -1);
        } else {
            Log.w(TAG, "Trying to clear a timeout that does not exist " + handle);
        }
    }

    public void JS_setInterval(final int milisseconds, final int handle) {
        // Log.d(TAG, "setInterval " + milisseconds + " " + handle);
        if (-2 != timeout_handles.get(handle, -2)) {
            Log.w(TAG, "timeout with handle " + handle + " already exists");
        }
        timeout_handles.put(handle, milisseconds);
        callLater(handle, milisseconds);
    }

    public void JS_clearInterval(int handle) {
        // Log.d(TAG, "clearInterval " + handle);
        if (-2 != timeout_handles.get(handle, -2)) {
            timeout_handles.put(handle, -1);
        } else {
            Log.w(TAG, "Trying to clear an interval that does not exist " + handle);
        }
    }

    public void JS_log(String txt) {
        Log.w(TAG, "log " + txt);
    }

    public void JS_printf(String txt) {
        Log.w(TAG, "print " + txt);
    }

    public void JS_alert(String text) {
        observer.g_alert(text);
    }

    /* utility functions */

    private String getResource(int id) throws IOException {
        InputStream is = observer.getResources().openRawResource(id);

        ByteArrayOutputStream bout = new ByteArrayOutputStream();

        byte[] readBuffer = new byte[1024];

        try {
            int read;
            do {
                read = is.read(readBuffer, 0, readBuffer.length);
                if (read == -1) {
                    break;
                }
                bout.write(readBuffer, 0, read);
            } while (true);

            return new String(bout.toByteArray(), "UTF-8");
        } finally {
            is.close();
        }
    }

    private Object exec(Function f, Object[] params) {
        Object ret = null;

        try {
            ret = f.call(rhino, scope, scope, params);
        } catch (RhinoException e) {
            Log.e(TAG, "Exception in engine");
            Log.e(TAG, e.getMessage());
            Log.e(TAG, e.getScriptStackTrace());
        }

        return ret;
    }


    private void callLater(final int handle, final int ms) {
        final Runnable r = new Runnable() {
            public void run() {
                timeoutAlarm(handle);
            }
        };
        h.postDelayed(r, ms);
    }

    private void timeoutAlarm(final int handle) {
        if (-2 == timeout_handles.get(handle, -2)) {
            Log.w(TAG, "Handle " + handle + " not assoc with timeout");
            return;
        }

        // test for cancellation
        int ms = timeout_handles.get(handle);
        if (ms < 0) {
            // Log.d(TAG, "Handle " + handle + " had been cancelled");
            timeout_handles.delete(handle);
            return;
        }

        // Log.d(TAG, "Handle " + handle + " cb");

        Function f = (Function) scope.get("timeoutCallback", scope);
        Object[] params = new Object[]{handle};
        exec(f, params);

        // reread to verify if callback cleared the interval
        ms = timeout_handles.get(handle);

        if (ms > 0) {
            // Log.d(TAG, "Rescheduling " + handle);
            callLater(handle, ms);
        } else {
            timeout_handles.delete(handle);
        }
    }
}

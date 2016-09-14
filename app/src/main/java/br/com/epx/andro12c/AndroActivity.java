/* Copyright (c) 2011-2014 Elvis Pfutzenreuter */

package br.com.epx.andro12c;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.media.AudioManager;
import android.media.SoundPool;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Vibrator;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.view.ViewTreeObserver.OnGlobalLayoutListener;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Date;
import java.util.HashMap;

public class AndroActivity extends Activity {
    ImageView face;
    Vibrator vib;
    SoundPool soundpool;
    int click_handle;
    int kfeedback;
    boolean fullscreen_enabled;
    boolean stretch_enabled;
    int separator;
    boolean wakelock_enabled;
    boolean portrait;
    int lockedlayout;
    AlertDialog.Builder alt_bld;
    AudioManager mgr;
    JavascriptEngine engine;
    JavascriptEngine engine_not_ready;
    Handler h;
    Date lastONpress;
    boolean on_screen;
    long lastActivity;
    boolean adCreated = false;

    final public String TAG = "androcalc";
    final int FEEDBACK_NONE = 0;
    final int FEEDBACK_HAPTIC_STRONG = 1;
    final int FEEDBACK_HAPTIC_WEAK = 2;
    final int FEEDBACK_AUDIO = 3;
    final int LAYOUT_PORTRAIT = 2;
    final int LAYOUT_LANDSCAPE = 1;
    final int LAYOUT_ROTATE = 0;

    boolean free_version;

    // remember that JavascriptEngine and values.xml also have coordinates
    float wh = 1757;
    float hh = 1080;
    float wv = 1080;
    float hv = 1726;

    double h_disp_x = 20 / wh;
    double h_disp_y = 51 / hh;
    double redf = 1.0; // 1.25
    double redstep = 1.0; // 1.2
    double h_width = 83 / wh / redf;
    double h_height = 83 * 1.2 / hh / redf;
    double h_step = h_width * redstep / redf;

    double h_font_size = 42.5 / hh / redf;
    double h_font_y = 150 / hh;
    double h_font_x = 10 / wh / redf;
    double h_ann_width = 200 / wh / redf;
    double[] h_font_ann;

    // 16C apocryphal display
    double h_font_apo_y = 51 / hh;
    double h_font_apo_1_x = 20 / wh;
    double h_font_apo_2_x = 1276 / wh;
    double h_ann_1_width = 112 / wh;
    double h_ann_2_width = 450 / wh;

    double v_disp_x = 65 / wv;
    double v_disp_y = 75 / hv;
    double v_width = 87 / wv;
    double v_height = 87 * 1.2 / hv;
    double v_step = v_width;

    double v_font_size = 42.5 / hv;
    double v_font_y = 185 / hv;
    double v_font_x = 80 / wv;
    double v_ann_width = 200 / wv;
    double[] v_font_ann;

    // 16C apocryphal display (hidden in vertical)
    double v_font_apo_y = 0;
    double v_font_apo_1_x = 0;
    double v_font_apo_2_x = 0;
    double v_ann_1_width = 0;
    double v_ann_2_width = 0;

    String[] annunciators;
    String[] anndefs;
    int[] anntype;

    float wtot, htot; // total width and height of screen
    float wmgr, hmgr; // unused margins (if stretch=off)
    float weff, heff; // effective width and height (diff from w/htot if stretch=off)

    ImageView[][] lcd;
    FrameLayout.LayoutParams[][] lcdlay;
    int[][] lcdmap;
    HashMap<String, TextView> ann;
    HashMap<String, FrameLayout.LayoutParams> annlay;

    // This is where we store saved memory files.
    File path;
    // Filename extension for memory files
    String memExt = ".mem";

    public String retrieveMemory() {
        /* must be thread-safe since it is called in engine thread context */
        SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);
        String memory = sp.getString("c1", "empt");
        return memory;
    }

    public void touchFeedback() {
        if (kfeedback == FEEDBACK_HAPTIC_STRONG) {
            if (vib != null) {
                vib.vibrate(37);
            }
        } else if (kfeedback == FEEDBACK_HAPTIC_WEAK) {
            if (vib != null) {
                vib.vibrate(10);
            }
        } else if (kfeedback == FEEDBACK_AUDIO) {
            if (click_handle != 0) {
                soundpool.play(click_handle, 1, 1, 1, 0, 1);
            }
        }
    }

    public void saveMemory(String c) {
        SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);
        SharedPreferences.Editor ed = sp.edit();
        ed.putString("c1", c);
        ed.commit();
        Log.w(TAG, "Memory saved");
    }

    public void keyON() {
        Date presstime = new Date();
        if (lastONpress == null ||
                (presstime.getTime() - lastONpress.getTime()) > 2000) {
            lastONpress = presstime;
            Toast.makeText(this, getResources().getString(R.string.press_on_again),
                    Toast.LENGTH_SHORT).show();
        } else {
            this.finish();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.menu, menu);

        return true;
    }

    public void set_layoutlock(int new_value) {
        boolean old_portrait = portrait;
        lockedlayout = new_value;

        if (lockedlayout == LAYOUT_LANDSCAPE) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else if (lockedlayout == LAYOUT_PORTRAIT) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);
        }

        portrait = (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);

        if (portrait != old_portrait) {
            update_screen();
        }
    }

    public void wakelock(boolean new_value) {
        wakelock_enabled = new_value;
        findViewById(R.id.face).setKeepScreenOn(wakelock_enabled);
    }

    // File picker dialog for memory files
    private AlertDialog fileDg = null;
    private String[] fileList;
    private String lastFile = "";
    private int fileAction = 0, choice = -1;

    private void loadMemFile(int which) {
        if (which >= 0) lastFile = fileList[which];
        if (lastFile.length() == 0) return;
        File file = new File(path, lastFile + memExt);
        try {
            // read the encoded memory from a previously written file (see below)
            FileReader in = new FileReader(file);
            BufferedReader inb = new BufferedReader(in);
            String c = inb.readLine();
            inb.close();
            // update the memory on the Java side
            saveMemory(c);
            // reload the engine with current memory
            engine.reload();
            update_screen();
            Toast.makeText(this, getResources().getString(R.string.loaded) +
                    file, Toast.LENGTH_SHORT).show();
        } catch (IOException e) {
            Log.e(TAG, "couldn't read memory file: " + e.toString());
            Toast.makeText(this, getResources().getString(R.string.not_loaded) +
                    file, Toast.LENGTH_SHORT).show();
        }
    }

    private void saveMemFile(int which) {
        if (which >= 0) lastFile = fileList[which];
        if (lastFile.length() == 0) return;
        File file = new File(path, lastFile + memExt);
        try {
            // write the encoded memory to a file in the data directory
            String c = retrieveMemory();
            FileWriter out = new FileWriter(file);
            out.write(c);
            out.close();
            Toast.makeText(this, getResources().getString(R.string.saved) +
                    file, Toast.LENGTH_SHORT).show();
        } catch (IOException e) {
            Log.e(TAG, "couldn't write memory file: " + e.toString());
            Toast.makeText(this, getResources().getString(R.string.not_saved) +
                    file, Toast.LENGTH_SHORT).show();
        }
    }

    private void deleteMemFile(int which) {
        if (which >= 0) lastFile = fileList[which];
        if (lastFile.length() == 0) return;
        File file = new File(path, lastFile + memExt);
        if (file.delete()) {
            Toast.makeText(this, getResources().getString(R.string.deleted) +
                    file, Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, getResources().getString(R.string.not_deleted) +
                    file, Toast.LENGTH_SHORT).show();
        }
    }

    private AlertDialog enterMemFile() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);

        builder.setTitle(getResources().getString(R.string.mem_file_title));
        final EditText input = new EditText(this);
        builder.setView(input);
        builder.setPositiveButton(getResources().getString(R.string.ok),
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        lastFile = input.getText().toString();
                        Log.d(TAG, "new file " + lastFile);
                        saveMemFile(-1);
                    }
                });
        builder.setNegativeButton(getResources().getString(R.string.cancel),
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        Log.d(TAG, "file picker cancel");
                    }
                });
        fileDg = builder.show();
        return fileDg;
    }

    private AlertDialog chooseMemFile(int action) {
        FilenameFilter filter = new FilenameFilter() {
            public boolean accept(File dir, String filename) {
                File sel = new File(dir, filename);
                return filename.endsWith(memExt) && !sel.isDirectory();
            }
        };
        fileList = path.list(filter);
        fileAction = action;

        // remove filename extensions
        int n = fileList.length;
        for (int i = 0; i < n; i++)
            fileList[i] = fileList[i].substring(0, fileList[i].length() - memExt.length());
        // sort the list alphabetically
        java.util.Arrays.sort(fileList);
        // determine the item with the last file (if any)
        choice = -1;
        for (int i = 0; i < n; i++) {
            int cmp = fileList[i].compareTo(lastFile);
            if (cmp == 0) {
                choice = i;
                break;
            } else if (cmp > 0) {
                break;
            }
        }
        if (choice < 0) lastFile = "";

        if (action != 1 && (fileList == null || n <= 0)) {
            Toast.makeText(this, getResources().getString(R.string.no_mem_files),
                    Toast.LENGTH_SHORT).show();
            return null;
        }

        AlertDialog.Builder builder = new AlertDialog.Builder(this);

        String title_header, files;
        if (action == 0) {
            title_header = getResources().getString(R.string.load_mem);
        } else if (action == 1) {
            title_header = getResources().getString(R.string.save_mem);
        } else {
            title_header = getResources().getString(R.string.delete_mem);
        }
        files = n > 1 ? getResources().getString(R.string.files) :
                getResources().getString(R.string.file);

        builder.setTitle(title_header +
                (choice >= 0 ? " [" + fileList[choice] + "]" : "") +
                (n > 0 ? (" : " + n + " " + files) : ""));

        if (fileList != null && fileList.length > 0) {
            builder.setSingleChoiceItems(fileList, choice, new DialogInterface.OnClickListener() {
                public void onClick(DialogInterface dialog, int which) {
                    Log.d(TAG, "choice: " + which + " " + fileList[which]);
                    choice = which;
                }
            });
        }

        if (fileList.length > 0) {
            builder.setPositiveButton(getResources().getString(R.string.ok),
                    new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int id) {
                            Log.d(TAG, "action: " + fileAction);
                            switch (fileAction) {
                                case 0:
                                    loadMemFile(choice);
                                    break;
                                case 1:
                                    saveMemFile(choice);
                                    break;
                                case 2:
                                    deleteMemFile(choice);
                                    break;
                            }
                        }
                    });
        }
        if (action == 1) {
            builder.setNeutralButton(getResources().getString(R.string.new_file),
                    new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int id) {
                            Log.d(TAG, "file picker create");
                            enterMemFile();
                        }
                    });
        }
        builder.setNegativeButton(getResources().getString(R.string.cancel),
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        Log.d(TAG, "file picker cancel");
                    }
                });
        fileDg = builder.show();
        return fileDg;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.feedback_none:
                kfeedback = FEEDBACK_NONE;
                break;
            case R.id.feedback_haptic_strong:
                kfeedback = FEEDBACK_HAPTIC_STRONG;
                break;
            case R.id.feedback_haptic_weak:
                kfeedback = FEEDBACK_HAPTIC_WEAK;
                break;
            case R.id.feedback_audio:
                kfeedback = FEEDBACK_AUDIO;
                break;
            case R.id.fullscreen_off:
                fullscreen_enabled = false;
                update_fullscreen();
                update_stretch();
                update_screen();
                break;
            case R.id.fullscreen_on:
                fullscreen_enabled = true;
                update_fullscreen();
                update_stretch();
                update_screen();
                break;
            case R.id.stretch_on:
                stretch_enabled = true;
                update_stretch();
                update_screen();
                break;
            case R.id.stretch_off:
                stretch_enabled = false;
                update_stretch();
                update_screen();
                break;
            case R.id.sleep_on:
                wakelock(true);
                break;
            case R.id.sleep_off:
                wakelock(false);
                break;
            case R.id.locklayout_portrait:
                set_layoutlock(LAYOUT_PORTRAIT);
                break;
            case R.id.locklayout_landscape:
                set_layoutlock(LAYOUT_LANDSCAPE);
                break;
            case R.id.locklayout_rotate:
                set_layoutlock(LAYOUT_ROTATE);
                break;
            case R.id.about_show:
                AlertDialog d = alt_bld.create();
                d.show();
                break;
            case R.id.memory_load: {
                chooseMemFile(0);
                break;
            }
            case R.id.memory_save:
                chooseMemFile(1);
                break;
            case R.id.memory_delete:
                chooseMemFile(2);
                break;
            case R.id.decimal_point:
                separator = 0;
                engine.separator(0);
                break;
            case R.id.decimal_comma:
                separator = 1;
                engine.separator(1);
                break;
            case R.id.decimal_indian:
                separator = 2;
                engine.separator(2);
                break;
        }

        SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);
        SharedPreferences.Editor ed = sp.edit();
        ed.putInt("key_feedback", kfeedback);
        ed.putBoolean("fullscreen", fullscreen_enabled);
        ed.putBoolean("stretch", stretch_enabled);
        ed.putBoolean("wakelock_enabled", wakelock_enabled);
        ed.putInt("locklayout", lockedlayout);
        ed.putInt("separator", separator);
        ed.commit();
        return true;
    }

    private void update_fullscreen() {
        if (fullscreen_enabled) {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        } else {
            getWindow().setFlags(0,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }
    }

    public void setAnnunciator(String name, String txt) {
        TextView annunciator = ann.get(name);
        if (annunciator == null) {
            // Log.d(TAG, "annunciator " + name + " is invalid");
            return;
        }
        txt = txt.replaceAll("&nbsp;", " ");
        txt = txt.replaceAll("<br>", "\n");
        txt = txt.replaceAll("^\\s+", "");
        // Log.d(TAG, "ann " + name + " = " + txt);
        annunciator.setText(txt);
    }

    public void setSegment(int digit, int segment, boolean lit) {
        if (digit < 0 || digit > 10 || segment < 1 || segment > 9) {
            Log.w(TAG, "invalid LCD digit passed by JS " + digit + " " + segment);
            return;
        }

        int ilit = lit ? View.VISIBLE : View.INVISIBLE;

        if (lcdmap[digit][segment] == ilit) {
            return;
        }

        lcdmap[digit][segment] = ilit;

        if (lcd == null) {
            return;
        }

        // Log.d(TAG, "lcd " + digit + ":" + segment + " = " + lit);
        lcd[digit][segment].setVisibility(ilit);
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        super.onPrepareOptionsMenu(menu);
        menu.findItem(R.id.feedback_menu).setVisible(!free_version);
        menu.findItem(R.id.display_menu).setVisible(!free_version);
        menu.findItem(R.id.memory).setVisible((!free_version) && path.exists());

        menu.findItem(R.id.feedback_audio).setChecked(kfeedback == FEEDBACK_AUDIO);
        menu.findItem(R.id.feedback_haptic_strong).setChecked(kfeedback == FEEDBACK_HAPTIC_STRONG);
        menu.findItem(R.id.feedback_haptic_weak).setChecked(kfeedback == FEEDBACK_HAPTIC_WEAK);
        menu.findItem(R.id.feedback_none).setChecked(kfeedback == FEEDBACK_NONE);

        menu.findItem(R.id.fullscreen_on).setChecked(fullscreen_enabled);
        menu.findItem(R.id.fullscreen_off).setChecked(!fullscreen_enabled);

        menu.findItem(R.id.sleep_on).setChecked(wakelock_enabled);
        menu.findItem(R.id.sleep_off).setChecked(!wakelock_enabled);

        menu.findItem(R.id.stretch_on).setChecked(stretch_enabled);
        menu.findItem(R.id.stretch_off).setChecked(!stretch_enabled);

        menu.findItem(R.id.locklayout_portrait).setChecked(lockedlayout == LAYOUT_PORTRAIT);
        menu.findItem(R.id.locklayout_landscape).setChecked(lockedlayout == LAYOUT_LANDSCAPE);
        menu.findItem(R.id.locklayout_rotate).setChecked(lockedlayout == LAYOUT_ROTATE);

        menu.findItem(R.id.decimal_point).setChecked(separator == 0);
        menu.findItem(R.id.decimal_comma).setChecked(separator == 1);
        menu.findItem(R.id.decimal_indian).setChecked(separator == 2);

        return true;
    }

    private void update_stretch() {
        if (wtot == 0 || htot == 0) {
            Log.w(TAG, "update_stretch: at least one dimension is zero");
            return;
        }

        float aspect = wtot / htot;
        float theo_aspect;

        if (portrait) {
            theo_aspect = wv / hv;
            Log.d(TAG, "Real aspect " + aspect + " theo aspect " + theo_aspect);
        } else {
            theo_aspect = wh / hh;
            Log.d(TAG, "Real aspect " + aspect + " theo aspect " + theo_aspect);
        }

        if (stretch_enabled) {
            // simple enough
            face.setScaleType(ImageView.ScaleType.FIT_XY);
            weff = wtot;
            heff = htot;
            wmgr = 0;
            hmgr = 0;
        } else {
            face.setScaleType(ImageView.ScaleType.FIT_CENTER);
            if (aspect > theo_aspect) {
                // screen is wider than calculator; margins at left and right
                heff = htot;
                hmgr = 0;
                weff = htot * theo_aspect;
                wmgr = (wtot - weff) / 2;
                Log.d(TAG, "Left margin: " + wmgr);
            } else {
                // screen is narrower than calculator; margins at top/bottom
                weff = wtot;
                wmgr = 0;
                heff = wtot / theo_aspect;
                hmgr = (htot - heff) / 2;
                Log.d(TAG, "Top margin: " + hmgr);
            }
        }

        hideLCD();
        h.postDelayed(new Runnable() {
            public void run() {
                positionLCD();
            }
        }, 100);
    }

    private void update_screen() {
        if (portrait) {
            // face.setImageResource(R.drawable.facev);
        } else {
            face.setImageResource(R.drawable.faceh);
        }

        if (engine == null) {
            Log.w(TAG, "Engine not loaded yet, reset delayed");
            return;
        }

        engine.reset(portrait);
    }

    private void hideLCD() {
        for (int digit = 0; digit <= 10; ++digit) {
            for (int segment = 1; segment < 10; ++segment) {
                lcd[digit][segment].setVisibility(View.INVISIBLE);
            }
        }
        for (String name : ann.keySet()) {
            ann.get(name).setVisibility(View.INVISIBLE);
        }
    }

    public void createLCD() {
        if (lcd != null) {
            Log.d(TAG, "LCD already created");
            return;
        }
        FrameLayout layout = (FrameLayout) face.getParent();
        if (layout == null) {
            Log.d(TAG, "Layout is null, not creating LCD");
            return;
        }

        Log.d(TAG, "Creating LCD");

        int lcdres[] = {R.drawable.lcd_orig, R.drawable.lcda, R.drawable.lcdb,
                R.drawable.lcdc, R.drawable.lcdd, R.drawable.lcde,
                R.drawable.lcdf, R.drawable.lcdg, R.drawable.lcdp,
                R.drawable.lcdt};

        lcd = new ImageView[11][];
        lcdlay = new FrameLayout.LayoutParams[11][];

        for (int digit = 0; digit <= 10; ++digit) {
            ImageView[] digit_set = new ImageView[10];
            FrameLayout.LayoutParams[] layout_set = new FrameLayout.LayoutParams[10];
            lcd[digit] = digit_set;
            lcdlay[digit] = layout_set;

            for (int segment = 1; segment < 10; ++segment) {
                // Log.d(TAG, "Creating " + digit + " "+ segment);
                ImageView s = new ImageView(this);
                int id = this.getResources().getIdentifier("lcd" + digit + "" + segment,
                        "id", this.getPackageName());
                if (id == 0) {
                    Log.e(TAG, "id not found: lcd" + digit + "" + segment);
                } else {
                    s.setId(id);
                }
                digit_set[segment] = s;

                FrameLayout.LayoutParams dl = new FrameLayout.LayoutParams(1, 1);
                dl.leftMargin = 1;
                dl.topMargin = 1;
                dl.gravity = Gravity.LEFT | Gravity.TOP;
                layout_set[segment] = dl;

                s.setImageResource(lcdres[segment]);
                s.setLayoutParams(dl);
                s.setScaleType(ImageView.ScaleType.FIT_XY);
                s.bringToFront();
                s.setVisibility(View.INVISIBLE);

                layout.addView(s);
            }
        }

        ann = new HashMap<String, TextView>();
        annlay = new HashMap<String, FrameLayout.LayoutParams>();

        for (int i = 0; i < annunciators.length; ++i) {
            TextView a = new TextView(this);
            int id = this.getResources().getIdentifier(annunciators[i],
                    "id", this.getPackageName());
            if (id == 0) {
                Log.e(TAG, "id not found: " + annunciators[i]);
            } else {
                a.setId(id);
            }
            ann.put(annunciators[i], a);
            FrameLayout.LayoutParams dla = new FrameLayout.LayoutParams(0, 0);
            dla.leftMargin = 1;
            dla.topMargin = 1;
            dla.gravity = Gravity.LEFT | Gravity.TOP;
            annlay.put(annunciators[i], dla);
            if (anntype[i] == 0) {
                a.setTypeface(Typeface.SANS_SERIF);
            } else {
                a.setTypeface(Typeface.MONOSPACE);
            }
            a.setTextColor(Color.BLACK);
            a.setTextSize(TypedValue.COMPLEX_UNIT_PX, 1);
            a.setLayoutParams(dla);
            a.bringToFront();
            a.setText(anndefs[i]);
            a.setVisibility(View.VISIBLE);
            layout.addView(a);
        }
    }

    private void positionLCD() {
        int width, height, step, x, y, font_y, font_x, ann_width;
        int font_apo_y, font_apo_x_1, font_apo_x_2, ann_1_width, ann_2_width;
        double[] font_x_ann;
        float font_h;

        if (portrait) {
            Log.d(TAG, "Positioning LCD for portrait");
            width = (int) (v_width * weff);
            height = (int) (v_height * heff);
            x = (int) (wmgr + v_disp_x * weff);
            y = (int) (hmgr + v_disp_y * heff);
            step = (int) (v_step * weff);
            font_h = (float) (v_font_size * heff);
            font_y = (int) (hmgr + v_font_y * heff);
            font_apo_y = (int) (hmgr + v_font_apo_y * heff);
            font_x = (int) (wmgr + v_font_x * weff);
            font_x_ann = v_font_ann;
            font_apo_x_1 = (int) (wmgr + v_font_apo_1_x * weff);
            font_apo_x_2 = (int) (wmgr + v_font_apo_2_x * weff);
            ann_width = (int) (v_ann_width * weff);
            ann_1_width = (int) (v_ann_1_width * weff);
            ann_2_width = (int) (v_ann_2_width * weff);
        } else {
            width = (int) (h_width * weff);
            height = (int) (h_height * heff);
            x = (int) (wmgr + h_disp_x * weff);
            y = (int) (hmgr + h_disp_y * heff);
            step = (int) (h_step * weff);
            Log.d(TAG, "Positioning LCD for landscape");
            font_h = (float) (h_font_size * heff);
            font_y = (int) (hmgr + h_font_y * heff);
            font_apo_y = (int) (hmgr + h_font_apo_y * heff);
            font_x = (int) (wmgr + h_font_x * weff);
            font_x_ann = h_font_ann;
            font_apo_x_1 = (int) (wmgr + h_font_apo_1_x * weff);
            font_apo_x_2 = (int) (wmgr + h_font_apo_2_x * weff);
            ann_width = (int) (h_ann_width * weff);
            ann_1_width = (int) (h_ann_1_width * weff);
            ann_2_width = (int) (h_ann_2_width * weff);
        }

        for (int digit = 0; digit <= 10; ++digit) {
            FrameLayout.LayoutParams[] layout_set = lcdlay[digit];
            ImageView[] digit_set = lcd[digit];
            for (int segment = 1; segment < 10; ++segment) {
                ImageView s = digit_set[segment];
                FrameLayout.LayoutParams dl = layout_set[segment];
                dl.width = width;
                dl.height = height;
                dl.leftMargin = x + digit * step;
                dl.topMargin = y;
                s.setVisibility(lcdmap[digit][segment]);
                s.requestLayout();
            }
        }

        for (int i = 0; i < annunciators.length; ++i) {
            TextView a = ann.get(annunciators[i]);
            FrameLayout.LayoutParams dla = annlay.get(annunciators[i]);
            if (anntype[i] == 0) {
                dla.leftMargin = (int) (font_x + font_x_ann[i] * weff);
                dla.topMargin = font_y;
                dla.width = ann_width;
                dla.height = (int) (font_h * 1.5);
            } else if (anntype[i] == 1) {
                // apocryphal wstatus 16c
                dla.leftMargin = font_apo_x_1;
                dla.topMargin = font_apo_y;
                dla.width = ann_1_width;
                dla.height = (int) (font_h * 3);
            } else if (anntype[i] == 2) {
                // apocryphal numeric 16c
                dla.leftMargin = font_apo_x_2;
                dla.topMargin = font_apo_y;
                dla.width = ann_2_width;
                dla.height = (int) (font_h * 4.5);
            }
            if (anntype[i] == 0 || !portrait) {
                a.setVisibility(View.VISIBLE);
            } else {
                a.setVisibility(View.INVISIBLE);
            }
            a.setTextSize(TypedValue.COMPLEX_UNIT_PX, font_h);
            a.requestLayout();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        // ignore orientation/keyboard change
        super.onConfigurationChanged(newConfig);
        portrait = (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);
        Log.d(TAG, "Configuration/orientation changed, portrait=" + portrait);
        update_stretch();
        update_screen();
    }

    private void processTouch(float tx, float ty) {
        indicateMovement();

        double x = ((tx - wmgr) / weff);
        double y = ((ty - hmgr) / heff);
        // Log.d(TAG, "touch at " + tx + ":" + ty + " => " + x + ":" + y);

        x *= (portrait ? wv : wh);
        y *= (portrait ? hv : hh);

        if (engine == null) {
            Log.w(TAG, "Engine not loaded yet");
            return;
        }

        engine.touch(x, y);
    }

    // Credit: http://stackoverflow.com/questions/9996333/openoptionsmenu-function-not-working-in-ics/17903128#17903128
    // Solves problem of not opening menu in tablets
    @Override
    public void openOptionsMenu() {
        Configuration config = getResources().getConfiguration();

        if ((config.screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK)
                > Configuration.SCREENLAYOUT_SIZE_LARGE) {

            int originalScreenLayout = config.screenLayout;
            config.screenLayout = Configuration.SCREENLAYOUT_SIZE_LARGE;
            super.openOptionsMenu();
            config.screenLayout = originalScreenLayout;

        } else {
            super.openOptionsMenu();
        }
    }

    public void indicateMovement() {
        lastActivity = System.nanoTime();
    }


    public void engine_ready() {
        engine = engine_not_ready;
        engine_not_ready = null;
        engine.reset(portrait);
        Log.d(TAG, "Initial engine reset completed");
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "resumed");
        on_screen = true;
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "paused");
        on_screen = false;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "destroyed");
        if (engine != null) {
            engine.die();
        }
        super.onDestroy();
    }


    /**
     * Called when the activity is first created.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        free_version = getResources().getBoolean(R.bool.free_version);
        annunciators = getResources().getStringArray(R.array.annunciators);
        anndefs = getResources().getStringArray(R.array.anndefs);
        int anntype_id = getResources().getIdentifier("anntype",
                "array", this.getPackageName());
        if (anntype_id != 0) {
            anntype = getResources().getIntArray(anntype_id);
        } else {
            anntype = new int[anndefs.length];
            for (int x = 0; x < anntype.length; ++x) {
                anntype[x] = 0;
            }
        }
        int[] hfontann = getResources().getIntArray(R.array.hfontann);
        int[] vfontann = getResources().getIntArray(R.array.vfontann);
        h_font_ann = new double[annunciators.length];
        v_font_ann = new double[annunciators.length];
        for (int x = 0; x < annunciators.length; ++x) {
            h_font_ann[x] = (double) hfontann[x] / wh;
            v_font_ann[x] = (double) vfontann[x] / wv;
        }
        path = new File(Environment.getExternalStorageDirectory() + "/" +
                getResources().getString(R.string.app_folder_name));

        h = new Handler();
        SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);

        boolean old_comma_enabled = sp.getBoolean("comma", false); // old parameter
        separator = sp.getInt("separator", -1); // not authoritative
        if (separator < 0) {
            // upgrade
            separator = old_comma_enabled ? 1 : 0;
            SharedPreferences.Editor ed = sp.edit();
            ed.putInt("separator", separator);
            ed.commit();
        }

        fullscreen_enabled = sp.getBoolean("fullscreen", free_version);
        stretch_enabled = sp.getBoolean("stretch", !free_version);
        lockedlayout = sp.getInt("locklayout", free_version ? LAYOUT_LANDSCAPE : LAYOUT_ROTATE);
        kfeedback = sp.getInt("key_feedback", free_version ? FEEDBACK_NONE : FEEDBACK_HAPTIC_STRONG);
        wakelock_enabled = sp.getBoolean("wakelock_enabled", false);

        if (free_version) {
            lockedlayout = LAYOUT_LANDSCAPE;
            fullscreen_enabled = true;
            stretch_enabled = true;
            kfeedback = FEEDBACK_NONE;
            wakelock_enabled = false;
        } else {
            // set up the data path
            path.mkdirs();
        }

        if (lockedlayout == LAYOUT_LANDSCAPE) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else if (lockedlayout == LAYOUT_PORTRAIT) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);
        }

        portrait = free_version ? false :
                (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);

        final AndroActivity self = this;

        h.postDelayed(new Runnable() {
            public void run() {
                engine_not_ready = new JavascriptEngine(self, free_version);
                Log.d(TAG, "Construction of engine completed");
            }
        }, 10);

        update_fullscreen();

        setContentView(R.layout.main);
        face = (ImageView) findViewById(R.id.face);

        lcdmap = new int[11][];
        for (int digit = 0; digit <= 10; ++digit) {
            lcdmap[digit] = new int[10];
            for (int segment = 1; segment < 10; ++segment) {
                lcdmap[digit][segment] = View.VISIBLE;
            }
        }

        createLCD();

        face.setOnTouchListener(new OnTouchListener() {
            public boolean onTouch(View v, MotionEvent event) {
                if (event.getActionMasked() == MotionEvent.ACTION_DOWN ||
                        event.getActionMasked() == MotionEvent.ACTION_POINTER_DOWN) {
                    float x = event.getX();
                    float y = event.getY();
                    processTouch(x, y);
                }
                return true;
            }
        });

        String app_ver;
        try {
            app_ver = this.getPackageManager().getPackageInfo(this.getPackageName(), 0).versionName;
        } catch (NameNotFoundException e) {
            app_ver = "1";
        }

        String msgb = getString(R.string.app_about);
        msgb = msgb.replace("@@", app_ver);

        alt_bld = new AlertDialog.Builder(this);
        alt_bld.setTitle(getString(R.string.about));
        alt_bld.setMessage(msgb);
        alt_bld.setNeutralButton(getString(R.string.back),
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                    }
                });

        if (!free_version) {
            vib = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        }
        mgr = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        soundpool = new SoundPool(1, AudioManager.STREAM_MUSIC, 0);

        click_handle = soundpool.load(this, R.raw.click, 1);

        face.getViewTreeObserver().addOnGlobalLayoutListener(new OnGlobalLayoutListener() {
            public void onGlobalLayout() {
                if (wtot == face.getWidth() && htot == face.getHeight()) {
                    Log.d(TAG, "Ignored tree observer event (unchanged coords)");
                    return;
                }
                wtot = face.getWidth();
                htot = face.getHeight();
                boolean looks_portrait = htot > wtot;
                if (looks_portrait != portrait) {
                    Log.d(TAG, "Ignored tree observer event (inconsistent orientation)");
                    return;
                }

                if (free_version && !adCreated) {
                    adCreated = true;

                    final int virtual_w = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 321, getResources().getDisplayMetrics());
                    final int virtual_h = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 101, getResources().getDisplayMetrics());

                    final float ad_real_w = wtot * 0.43f;
                    final int ad_real_left = (int) (wtot - ad_real_w);
                    final float scale = ad_real_w / virtual_w;

                    AdView ad = new AdView(self);
                    ad.setAdSize(AdSize.LARGE_BANNER);
                    ad.setAdUnitId(getResources().getString(R.string.adsense));

                    Animation animation = new ScaleAnimation(1.0f, scale, 1.0f, scale,
                            Animation.RELATIVE_TO_SELF, 0, Animation.RELATIVE_TO_SELF, 0);
                    animation.setFillAfter(true);
                    animation.setDuration(0);
                    ad.setAnimation(animation);

                    FrameLayout.LayoutParams dl = new FrameLayout.LayoutParams(1, 1);
                    dl.leftMargin = ad_real_left;
                    dl.topMargin = 0;
                    dl.gravity = Gravity.LEFT | Gravity.TOP;
                    dl.width = virtual_w;
                    dl.height = virtual_h;
                    ad.setLayoutParams(dl);
                    ad.bringToFront();
                    FrameLayout layout = (FrameLayout) face.getParent();
                    layout.addView(ad);

                    AdRequest adRequest = new AdRequest.Builder()
                            // .addTestDevice("0093B1E919AAA7E1C347112E18718B08")
                            // .addTestDevice("7EDEEB9CEBED15BCAF01FB7CA7A02AB9")
                            .build();
                    ad.loadAd(adRequest);
                }

                update_stretch();
            }
        });

        update_screen();
        wakelock(wakelock_enabled);

        indicateMovement();
    }

    public void lcd_left() {
        openOptionsMenu();
    }

    public void lcd_right() {
        openOptionsMenu();
    }
}
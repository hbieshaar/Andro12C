import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewInteraction;
import android.support.test.espresso.action.CoordinatesProvider;
import android.support.test.espresso.action.GeneralClickAction;
import android.support.test.espresso.action.Press;
import android.support.test.espresso.action.Tap;
import android.support.test.espresso.matcher.ViewMatchers;
import android.test.ActivityInstrumentationTestCase2;
import android.util.Log;
import android.view.View;

import org.junit.FixMethodOrder;
import org.junit.runners.MethodSorters;

import java.util.HashMap;
import java.util.Random;

import br.com.epx.andro12c.AndroActivity;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.withEffectiveVisibility;
import static android.support.test.espresso.matcher.ViewMatchers.withId;
import static android.support.test.espresso.matcher.ViewMatchers.withText;

@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class MyTest extends ActivityInstrumentationTestCase2<AndroActivity> {
    ViewInteraction lcd[][];
    HashMap<String, String> lcd_table = new HashMap<String, String>();
    final static String lcdruler = "xabcdefgpt";
    final static String TAG = "androtest ";
    final static int[] kt = {47, 37, 38, 39, 27, 28, 29, 17, 18, 19};
    final static String kchars =
            "0123456789" +
                    "/ABCDEF???" +
                    "xGHIJKL???" +
                    "-MNOPQR???" +
                    "+Xfgsr??.S" +
                    "()";

    ViewInteraction mod, scr;
    Activity act;

    public MyTest() {
        super(AndroActivity.class);

        lcd_table.put("-", "d");
        lcd_table.put(" ", "");
        lcd_table.put("0", "abcefg");
        lcd_table.put("1", "cf");
        lcd_table.put("2", "acdeg");
        lcd_table.put("3", "acdfg");
        lcd_table.put("4", "bcdf");
        lcd_table.put("5", "abdfg");
        lcd_table.put("6", "abdefg");
        lcd_table.put("7", "acf");
        lcd_table.put("8", "abcdefg");
        lcd_table.put("9", "abcdfg");
        lcd_table.put("0", "abcefg");
        // lcd_table['.'] = "p";
        // lcd_table[','] = "t";
    }

    // from http://stackoverflow.com/questions/22177590/click-by-bounds-coordinates
    public static ViewAction clickp(final float x, final float y) {
        return new GeneralClickAction(
                Tap.SINGLE,
                new CoordinatesProvider() {
                    @Override
                    public float[] calculateCoordinates(View view) {

                        final int[] screenPos = new int[2];
                        view.getLocationOnScreen(screenPos);

                        final float screenX = screenPos[0] + x * view.getWidth();
                        final float screenY = screenPos[1] + y * view.getHeight();
                        float[] coordinates = {screenX, screenY};

                        return coordinates;
                    }
                },
                Press.FINGER);
    }

    // return key position as proportion (percentage)
    public static float[] keycoords(final int key) {
        if (key == 50) {
            // left upper area
            return new float[]{0.01f, 0.01f};
        } else if (key == 51) {
            // right upper area
            return new float[]{0.99f, 0.01f};
        }

        int k = key;

        // convert key to monotonic sequence (11-20, 21-30...)

        if (k % 10 == 0 && k >= 10) {
            // arithmetic
            k += 10;
        } else if (k < 10) {
            k = kt[k];
        }

        final float x = (float) (25.0 + ((k - 1) % 10) * (1617.0 - 25.0) / 9) / 1757.0f;
        final float y = (float) (366.0 + ((k - 11) / 10) * (948.0 - 366.0) / 3) / 1080f;
        return new float[]{x, y};
    }

    public static float[] keycoords(final char key) {
        int ik = kchars.indexOf(key);
        assertTrue("key not found: " + key, ik > -1);
        return keycoords(ik);
    }

    public static ViewAction clickp(final char key) {
        float[] coords = keycoords(key);
        assertTrue("X coordinate must be 0..1", coords[0] >= 0.0 && coords[0] <= 1.0);
        assertTrue("Y coordinate must be 0..1", coords[1] >= 0.0 && coords[1] <= 1.0);
        return clickp(coords[0], coords[1]);
    }

    public void typ(final String keys) {
        for (int i = 0; i < keys.length(); ++i) {
            char k = keys.charAt(i);
            scr.perform(clickp(k));
            slep(250);
        }
    }

    private boolean visible(ViewInteraction v) {
        try {
            v.check(matches(withEffectiveVisibility(ViewMatchers.Visibility.VISIBLE)));
        } catch (AssertionError e) {
            return false;
        }
        return true;
    }

    private String lcd_digit_read(int n) {
        String t = "";
        for (int i = 1; i <= 7; ++i) {
            if (visible(lcd[n][i])) {
                t += lcdruler.charAt(i);
            }
        }
        char u = '%';
        for (String key : lcd_table.keySet()) {
            if (lcd_table.get(key).equals(t)) {
                u = key.charAt(0);
                break;
            }
        }
        assertTrue("Unknown LCD digit (" + t + ")", u != '%');

        String uu = "" + u;

        if (visible(lcd[n][8]) && visible(lcd[n][9])) {
            uu += "$,";
        } else if (visible(lcd[n][8])) {
            uu += "$.";
        }

        return uu;
    }

    private String lcd_read() {
        String t = "";
        for (int i = 0; i < 11; ++i) {
            t += lcd_digit_read(i);
        }
        return t;
    }

    private String lcd_translate(String s) {
        String t = "";
        int digit_count = 0;
        for (int i = 0; i < s.length(); ++i) {
            char c = s.charAt(i);
            if (c == '.' || c == ',') {
                // signals compression
                t += "$";
            } else {
                digit_count += 1;
            }
            t += c;
        }
        while (digit_count < 11) {
            t += " ";
            digit_count += 1;
        }
        return t;
    }

    private void lcd_test(String sexpected) {
        String expected = lcd_translate(sexpected);
        String actual = lcd_read();
        assertEquals("LCD expected " + sexpected +
                        " encoded expected " + expected + "(len " + expected.length() + ")" +
                        " actual " + actual + "(len " + actual.length() + ")",
                expected, actual);
        Log.w(TAG, "LCD is " + sexpected);
    }

    private void mod_test(String expected) {
        mod.check(matches(withText(expected)));
    }

    public int get_id(String idname) {
        int id = act.getResources()
                .getIdentifier(act.getPackageName() + ":id/" + idname, null, null);
        assertTrue("View ID not zero", id != 0);
        return id;
    }

    public ViewInteraction get_view(String idname) {
        ViewInteraction v = onView(withId(get_id(idname)));
        assertTrue("View not null", v != null);
        return v;
    }

    public void find_elements() {
        mod = get_view("dmodifier");
        scr = get_view("face");
        lcd = new ViewInteraction[11][];
        for (int digit = 0; digit <= 10; ++digit) {
            lcd[digit] = new ViewInteraction[10];
            for (int segment = 1; segment < 10; ++segment) {
                String name = "lcd" + digit + "" + segment;
                lcd[digit][segment] = get_view(name);
            }
        }
    }

    private void slep(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void setUp() throws Exception {
        super.setUp();
        act = getActivity();
        find_elements();
        slep(1500);
    }

    public void testO00() {
        // dummy test to clear prefs
        SharedPreferences preferences = act.getPreferences(Context.MODE_PRIVATE);
        preferences.edit().clear().commit();
        SharedPreferences prefs =
                PreferenceManager.getDefaultSharedPreferences(act);
        prefs.edit().clear().commit();
    }

    public void testO10() {
        lcd_test(" 0.00");
        typ("3");
        lcd_test(" 3.");
        typ("R");
        lcd_test(" 3.00");

        int alea = (new Random()).nextInt(399) + 1;
        typ("" + alea);
        typ("+");
        lcd_test(" " + (alea + 3) + ".00");
        typ("s");
        mod_test("STO");
        typ("1");
        mod_test("");
        typ("0R");

        // menu
        typ("(");
        // About
        onView(withText("About")).perform(click());
        onView(withText("Back")).perform(click());

        // menu
        typ("(");
        // Decimal format
        onView(withText("Number format")).perform(click());
        onView(withText("1.111.111,9")).perform(click());
        slep(250);
        lcd_test(" 0,00");
        typ("123456R");
        lcd_test(" 123.456,00");

        typ("(");
        onView(withText("Number format")).perform(click());
        onView(withText("11,11,111.9")).perform(click());
        slep(250);
        lcd_test(" 1,23,456.00");

        typ("(");
        onView(withText("Number format")).perform(click());
        onView(withText("1,111,111.9")).perform(click());
        slep(250);
        lcd_test(" 123,456.00");
        typ("X"); // force save memory
    }

    public void testO20() {
        slep(1500);
        // verify that memory is preserved
        lcd_test(" 123,456.00");
        typ("00R");
        lcd_test(" 0.00");
    }

    public void testO30() {
        slep(1500);
        typ("XX");
    }

    public void testO40() {
        // feedback de tela
        // refaz testes na vertical (muda mapa teclas!)
        // feedback audio / haptic 1 / haptic 2 / off
        // visual feedback on/off
        // Display: lock portrait / lock landscape / rotation
        // Display: fullscreen on/off
        // Save mem
        // Load mem
        // Del mem
        // Speed on/off
        // Show back
    }
}
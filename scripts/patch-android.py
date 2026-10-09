#!/usr/bin/env python3
"""Apply Iron Front's landscape + immersive Android settings after `cap add/sync android`."""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
android = root / "android"
if not android.exists():
    raise SystemExit("android/ does not exist. Run: npx cap add android")

manifest = android / "app/src/main/AndroidManifest.xml"
text = manifest.read_text()
activity_match = re.search(r"<activity\b[^>]*android:name=\"\.MainActivity\"[^>]*>", text, re.S)
if not activity_match:
    raise SystemExit("Could not find MainActivity in AndroidManifest.xml")
tag = activity_match.group(0)
if "android:screenOrientation=" not in tag:
    tag = tag[:-1] + '\n            android:screenOrientation="sensorLandscape">'
if "android:configChanges=" in tag and "orientation" not in tag:
    tag = re.sub(r'android:configChanges="([^"]*)"', lambda m: f'android:configChanges="{m.group(1)}|orientation|screenSize"', tag)
text = text[:activity_match.start()] + tag + text[activity_match.end():]
manifest.write_text(text)

styles = android / "app/src/main/res/values/styles.xml"
text = styles.read_text()
items = [
    '<item name="android:windowFullscreen">true</item>',
    '<item name="android:windowActionModeOverlay">true</item>',
    '<item name="android:windowNoTitle">true</item>',
    '<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>',
    '<item name="android:statusBarColor">@android:color/transparent</item>',
    '<item name="android:navigationBarColor">@android:color/transparent</item>',
    '<item name="android:windowLightStatusBar">false</item>',
    '<item name="android:windowLightNavigationBar">false</item>',
]
marker = '<style name="AppTheme.NoActionBar"'
try:
    start = text.index(marker)
    opening_end = text.index('>', start) + 1
except ValueError as exc:
    raise SystemExit("Could not find AppTheme.NoActionBar in styles.xml") from exc
missing = [item for item in items if item not in text]
if missing:
    text = text[:opening_end] + "\n        " + "\n        ".join(missing) + text[opening_end:]
styles.write_text(text)

java_files = list((android / "app/src/main/java").rglob("MainActivity.java"))
if java_files:
    main = java_files[0]
    old = main.read_text()
    package = re.search(r"^package\s+([\w.]+);", old, re.M)
    if not package:
        raise SystemExit("Could not determine MainActivity Java package")
    main.write_text(f'''package {package.group(1)};

import android.os.Bundle;
import android.view.View;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        enterImmersiveMode();
    }}

    @Override
    public void onResume() {{
        super.onResume();
        enterImmersiveMode();
    }}

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {{
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersiveMode();
    }}

    private void enterImmersiveMode() {{
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View decor = getWindow().getDecorView();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), decor);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        // Fallback for older WebViews / Android versions.
        decor.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }}
}}
''')
else:
    kotlin_files = list((android / "app/src/main/java").rglob("MainActivity.kt"))
    if not kotlin_files:
        raise SystemExit("Could not find MainActivity.java or MainActivity.kt")
    print("Kotlin MainActivity found; manifest/styles patched, but immersive Java replacement skipped.", file=sys.stderr)

print("Android patched: sensorLandscape + fullscreen immersive system bars")
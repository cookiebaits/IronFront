import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { configureAndroid, patchManifest, patchStyles } from './prepare-android.mjs';

const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter><action android:name="android.intent.action.MAIN" /></intent-filter>
        </activity>
        <activity android:name=".OtherActivity" android:screenOrientation="portrait"></activity>
    </application>
</manifest>`;

const styles = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
    </style>
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
    </style>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
    </style>
</resources>`;

test('landscape is set only on MainActivity and repeated patches are stable', () => {
  const patched = patchManifest(manifest);
  assert.match(patched, /android:name="\.MainActivity"[^>]*android:screenOrientation="sensorLandscape"/);
  assert.match(patched, /android:name="\.OtherActivity" android:screenOrientation="portrait"/);
  assert.equal(patchManifest(patched), patched);
});

test('existing portrait orientation is replaced, not duplicated', () => {
  const prior = manifest.replace('android:name=".MainActivity"', 'android:name="com.ironfront.tactics.MainActivity" android:screenOrientation="portrait"');
  const patched = patchManifest(prior);
  const tag = patched.match(/<activity[^>]*tactics\.MainActivity[^>]*>/)[0];
  assert.equal((tag.match(/android:screenOrientation=/g) ?? []).length, 1);
  assert.match(tag, /sensorLandscape/);
});

test('fullscreen items are added once and existing theme values are preserved', () => {
  const patched = patchStyles(styles);
  assert.match(patched, /name="android:windowFullscreen">true<\/item>/);
  assert.match(patched, /name="android:windowLayoutInDisplayCutoutMode">shortEdges<\/item>/);
  assert.match(patched, /name="colorPrimary">@color\/colorPrimary<\/item>/);
  assert.match(patched, /parent="Theme\.SplashScreen"/);
  assert.equal(patchStyles(patched), patched);
});

test('previous fullscreen values are normalized', () => {
  const prior = styles.replace('<item name="windowActionBar">false</item>', '<item name="windowActionBar">false</item>\n        <item name="android:windowFullscreen">false</item>');
  const patched = patchStyles(prior);
  assert.equal((patched.match(/name="android:windowFullscreen"/g) ?? []).length, 1);
  assert.match(patched, /name="android:windowFullscreen">true<\/item>/);
});

test('missing expected activity or theme produces an actionable error', () => {
  assert.throws(() => patchManifest('<manifest />'), /MainActivity was not found/);
  assert.throws(() => patchStyles('<resources />'), /AppTheme.NoActionBar was not found/);
});

test('configuration removes legacy .xml.bak files without deleting unrelated files', () => {
  const root = mkdtempSync(join(tmpdir(), 'ironfront-android-'));
  try {
    const main = join(root, 'android/app/src/main');
    const values = join(main, 'res/values');
    mkdirSync(values, { recursive: true });
    writeFileSync(join(main, 'AndroidManifest.xml'), manifest);
    writeFileSync(join(values, 'styles.xml'), styles);
    writeFileSync(join(values, 'styles.xml.bak'), styles);
    writeFileSync(join(main, 'AndroidManifest.xml.bak'), manifest);
    writeFileSync(join(values, 'colors.xml'), '<resources />');
    configureAndroid(root);
    assert.equal(existsSync(join(values, 'styles.xml.bak')), false);
    assert.equal(existsSync(join(main, 'AndroidManifest.xml.bak')), false);
    assert.equal(readFileSync(join(values, 'colors.xml'), 'utf8'), '<resources />');
    assert.match(readFileSync(join(main, 'AndroidManifest.xml'), 'utf8'), /sensorLandscape/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function setAttribute(tag, name, value) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const attribute = new RegExp(`\\s+${escaped}\\s*=\\s*(["'])[^"']*\\1`, 'g');
  return tag.replace(attribute, '').replace(/>$/, ` ${name}="${value}">`);
}

export function patchManifest(xml) {
  let found = false;
  const patched = xml.replace(/<activity\b[^>]*>/g, (tag) => {
    if (!/android:name\s*=\s*["'][^"']*\bMainActivity["']/.test(tag)) return tag;
    found = true;
    return setAttribute(tag, 'android:screenOrientation', 'sensorLandscape');
  });
  if (!found) throw new Error('MainActivity was not found in AndroidManifest.xml. Check the Capacitor Android project.');
  return patched;
}

export function patchStyles(xml) {
  let found = false;
  const patched = xml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, (block) => {
    const opening = block.slice(0, block.indexOf('>') + 1);
    if (!/\bname\s*=\s*["']AppTheme\.NoActionBar["']/.test(opening)) return block;
    found = true;
    // Remove prior values before inserting, so a repeated build doesn't duplicate resource items.
    const cleaned = block.replace(/\s*<item\b[^>]*\bname\s*=\s*(["'])android:(?:windowFullscreen|windowLayoutInDisplayCutoutMode)\1[^>]*>[\s\S]*?<\/item>/g, '');
    return cleaned.replace(/\s*<\/style>$/, '\n        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>\n    </style>');
  });
  if (!found) throw new Error('AppTheme.NoActionBar was not found in styles.xml. Check the Capacitor Android project.');
  return patched;
}

export function configureAndroid(root = process.cwd()) {
  const manifest = resolve(root, 'android/app/src/main/AndroidManifest.xml');
  const styles = resolve(root, 'android/app/src/main/res/values/styles.xml');
  // Validate both documents before writing either one.
  const manifestXml = patchManifest(readFileSync(manifest, 'utf8'));
  const stylesXml = patchStyles(readFileSync(styles, 'utf8'));
  writeFileSync(manifest, manifestXml);
  writeFileSync(styles, stylesXml);
  // Old builds used sed -i.bak. Android resource files must end in .xml, not .xml.bak.
  rmSync(`${styles}.bak`, { force: true });
  rmSync(`${manifest}.bak`, { force: true });
  console.log('Android activity configured for sensor landscape and a fullscreen theme.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { configureAndroid(); }
  catch (error) {
    console.error(`Android configuration failed: ${error.message}`);
    process.exitCode = 1;
  }
}
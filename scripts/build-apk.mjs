import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('🎨 [0/3] Синхронизация всех иконок и логотипов из 2.png...');
const src = path.resolve('2.png');
if (fs.existsSync(src)) {
  const desktopPaths = [
    'packages/desktop/electron/icon.png',
    'packages/desktop/public/favicon.png',
    'packages/desktop/public/logo.png',
    'packages/desktop/src/assets/logo.png',
    'packages/desktop/dist/favicon.png',
    'packages/desktop/dist/logo.png'
  ];
  for (const p of desktopPaths) {
    const full = path.resolve(p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.copyFileSync(src, full);
  }

  const mobilePaths = [
    'packages/mobile/src/assets/logo.png',
    'packages/mobile/public/favicon.png',
    'packages/mobile/public/logo.png'
  ];
  for (const p of mobilePaths) {
    const full = path.resolve(p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.copyFileSync(src, full);
  }

  const resDir = path.resolve('packages/mobile/android/app/src/main/res');
  function walkAndReplace(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkAndReplace(full);
      } else if (entry.name.endsWith('.png')) {
        fs.copyFileSync(src, full);
      }
    }
  }
  walkAndReplace(resDir);

  const vectorFg = path.join(resDir, 'drawable-v24', 'ic_launcher_foreground.xml');
  if (fs.existsSync(vectorFg)) {
    fs.unlinkSync(vectorFg);
  }

  const bgXml = path.join(resDir, 'values', 'ic_launcher_background.xml');
  if (fs.existsSync(bgXml)) {
    fs.writeFileSync(bgXml, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0d0e14</color>\n</resources>\n');
  }
}

console.log('🚀 [1/3] Сборка мобильного бандла @axon/mobile...');
execSync('npm run build --workspace=@axon/mobile', { stdio: 'inherit' });

console.log('🔄 [2/3] Синхронизация Capacitor Android...');
const mobileDir = path.resolve('packages/mobile');
execSync('npx cap sync android', { cwd: mobileDir, stdio: 'inherit' });

console.log('📦 [3/3] Компиляция подписанного Release APK через Gradle...');
const androidDir = path.resolve('packages/mobile/android');
const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
execSync(`${gradlewCmd} assembleRelease`, { cwd: androidDir, stdio: 'inherit' });

const generatedApk = path.resolve(
  'packages/mobile/android/app/build/outputs/apk/release/app-release.apk'
);
const releaseDir = path.resolve('release');
fs.mkdirSync(releaseDir, { recursive: true });
const targetApk = path.resolve(releaseDir, 'NeyroNetbook.apk');

if (fs.existsSync(generatedApk)) {
  fs.copyFileSync(generatedApk, targetApk);
  const sizeMb = (fs.statSync(targetApk).size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 УСПЕШНО! Подписанный Release APK создан: ${targetApk} (${sizeMb} МБ)`);
} else {
  console.error('\n❌ Ошибка: файл app-release.apk не найден после сборки.');
}

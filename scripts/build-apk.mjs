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

  // Ensure GitHub Workflows
  const ghDir = path.resolve('.github', 'workflows');
  fs.mkdirSync(ghDir, { recursive: true });
  const releaseYml = `name: Multi-Platform Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-desktop:
    name: Build Desktop (\${{ matrix.os }})
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest, macos-latest]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Shared Package
        run: npm run build:shared

      - name: Build Desktop Bundle
        run: npm run build:desktop

      - name: Package Windows Binary
        if: matrix.os == 'windows-latest'
        run: npm run build:win --workspace=@axon/desktop

      - name: Package Linux Binary
        if: matrix.os == 'ubuntu-latest'
        run: npm run build:linux --workspace=@axon/desktop

      - name: Package macOS Binary
        if: matrix.os == 'macos-latest'
        run: npm run build:mac --workspace=@axon/desktop

      - name: Upload Desktop Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: desktop-\${{ matrix.os }}
          path: release/*

  build-android:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install dependencies
        run: npm ci

      - name: Build Shared & Mobile
        run: |
          npm run build:shared
          npm run build:mobile

      - name: Sync Capacitor Android
        working-directory: packages/mobile
        run: npx cap sync android

      - name: Build Release APK via Gradle
        working-directory: packages/mobile/android
        run: ./gradlew assembleRelease

      - name: Upload Android APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: packages/mobile/android/app/build/outputs/apk/release/*.apk

  release:
    name: Create GitHub Release
    needs: [build-desktop, build-android]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download all build artifacts
        uses: actions/download-artifact@v4
        with:
          path: release-artifacts

      - name: Publish GitHub Release
        uses: softprops/action-gh-release@v2
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: release-artifacts/**/*
          generate_release_notes: true
          draft: false
          prerelease: false
`;
  fs.writeFileSync(path.join(ghDir, 'release.yml'), releaseYml, 'utf8');

  // Copy screenshots to docs/screenshots
  const docsDir = path.resolve('docs', 'screenshots');
  fs.mkdirSync(docsDir, { recursive: true });
  const scrinDir = path.resolve('scrinshot');
  if (fs.existsSync(scrinDir)) {
    const sFiles = fs.readdirSync(scrinDir);
    for (const sf of sFiles) {
      if (sf.endsWith('.png')) {
        fs.copyFileSync(path.join(scrinDir, sf), path.join(docsDir, sf));
      }
    }
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
const targetApk = path.resolve(releaseDir, 'NyronNotebook.apk');

// Remove old root apk if exists
const oldRootApk = path.resolve('NyronNotebook.apk');
if (fs.existsSync(oldRootApk)) {
  try { fs.unlinkSync(oldRootApk); } catch {}
}

if (fs.existsSync(generatedApk)) {
  fs.copyFileSync(generatedApk, targetApk);
  const sizeMb = (fs.statSync(targetApk).size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 УСПЕШНО! Подписанный Release APK создан: ${targetApk} (${sizeMb} МБ)`);
} else {
  console.error('\n❌ Ошибка: файл app-release.apk не найден после сборки.');
}

import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const sdkPath = path.join(localAppData, 'Android', 'Sdk');
const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const emulatorPath = path.join(sdkPath, 'emulator', 'emulator.exe');
const releaseApk = path.resolve('release', 'NyronNotebook.apk');
const rootApk = path.resolve('NyronNotebook.apk');
const apkPath = fs.existsSync(releaseApk) ? releaseApk : rootApk;

if (!fs.existsSync(apkPath)) {
  console.error('❌ APK не найден! Сначала соберите его: npm run build:apk');
  process.exit(1);
}

console.log('📱 Проверка запущенных эмуляторов...');
try {
  const devicesOutput = execSync(`"${adbPath}" devices`, { encoding: 'utf-8' });
  const lines = devicesOutput.trim().split('\n').slice(1);
  let activeDevice = lines.find((l) => l.includes('device') && !l.includes('offline'));

  if (!activeDevice) {
    console.log('🚀 Запуск эмулятора Pixel_10_Pro в фоновом режиме...');
    const emuProcess = spawn(emulatorPath, ['-avd', 'Pixel_10_Pro'], {
      detached: true,
      stdio: 'ignore',
    });
    emuProcess.unref();

    console.log('⏳ Ожидание загрузки Android эмулятора (boot)...');
    execSync(`"${adbPath}" wait-for-device`, { stdio: 'inherit' });

    let booted = false;
    for (let i = 0; i < 60; i++) {
      try {
        const check = execSync(`"${adbPath}" shell getprop sys.boot_completed`, {
          encoding: 'utf-8',
        }).trim();
        if (check === '1') {
          booted = true;
          break;
        }
      } catch {}
      execSync('timeout /t 2 >nul 2>&1', { shell: true });
    }
  }

  console.log('📦 Установка NyronNotebook.apk на эмулятор...');
  execSync(`"${adbPath}" install -r "${apkPath}"`, { stdio: 'inherit' });

  console.log('▶️ Запуск приложения com.nyronnotebook.mobile...');
  execSync(`"${adbPath}" shell am start -n com.nyronnotebook.mobile/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER`, {
    stdio: 'inherit',
  });

  console.log('🎉 Готово! Приложение запущено на эмуляторе Pixel_10_Pro.');
} catch (err) {
  console.error('Ошибка запуска:', err);
}

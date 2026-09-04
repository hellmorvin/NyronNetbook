import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nyronnotebook.mobile',
  appName: 'NeyroNetbook',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow local LAN IP connections for P2P sync
  },
  android: {
    backgroundColor: '#0c0d12',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#0c0d12',
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#0c0d12',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
};

export default config;

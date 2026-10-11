import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.usecomus.olympus',
  appName: 'purelyİstanbul',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://purelyistanbul--xenios-prod-c55cd.us-central1.hosted.app',
    cleartext: true,
    allowNavigation: ['*'],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#090807',
    preferredContentMode: 'mobile',
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xenios.istanbul',
  appName: 'purelyİstanbul',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://www.purelyistanbul.com',
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

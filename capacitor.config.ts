import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xenios.istanbul',
  appName: 'purelyİstanbul',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://xenios-production.up.railway.app',
    cleartext: true,
    allowNavigation: ['*'],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f8f6f0',
    preferredContentMode: 'mobile',
  },
};

export default config;

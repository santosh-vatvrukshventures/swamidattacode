import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swamidatta.app',
  appName: 'Swamidatta Traders',
  webDir: 'dist',
  server: {
    url: 'https://swamidatta.vercel.app/',
    cleartext: true
  }
};

export default config;

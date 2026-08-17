import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sportsos.app',
    appName: 'Sports OS',
    webDir: 'dist',
    plugins: {
        StatusBar: {
            // Light theme: white background, dark (visible) icons
            style: 'DARK',
            backgroundColor: '#ffffff',
            overlaysWebView: false,
        },
        SplashScreen: {
            launchShowDuration: 1500,
            launchAutoHide: true,
            backgroundColor: '#ffffff',
            androidSplashResourceName: 'splash',
            showSpinner: false,
            splashFullScreen: false,
            splashImmersive: false,
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
    },
};

export default config;

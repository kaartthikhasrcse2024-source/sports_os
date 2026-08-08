# Android Deployment via Capacitor

This repository features the Sports OS Web App wrapped natively specifically targeting Android systems via the core Capacitor plugins configured directly across our `dist` directories.

## Synchronizing the APK Android Build

Once you have validated React dependencies and compiled the web app (`npm run build`), you can natively synchronize these frontend payload bundles into standard Native Android code execution via following these steps smoothly:

### 1. Build Final Web Packages
Make sure to parse active modifications cleanly targeting optimal VITE variables:
```bash
cd client
npm run build
```

### 2. Add/Sync Capacitor Environments
With `@capacitor/android` natively installed within the package structures, push the built modules across into your explicit native environments securely:
```bash
npx cap add android   # (Only required once assuming the module doesn't exist)
npx cap sync android  # Map /dist arrays specifically against the Android runtime structures
```

### 3. Open Android Studio
Capacitor bridges dynamically launching exact deployment projects inside Studio:
```bash
npx cap open android
```
- Or simply open the explicit `/client/android` path strictly inside your Android Studio layouts.

### 4. Build Constraints & Virtualization
Inside Android Studio:
1. Allow initial **Gradle Syncing** components parsing natively (bottom-right tracking).
2. Establish a **Virtual Device Emulator (AVD)** matching standard 375px rendering requirements (Google Pixel etc.).
3. **Run App (Shift + F10):** Studio dynamically runs debug builds verifying Push Notifications stubs and intercepting original Location tracking via `@capacitor/geolocation` smoothly executing bounds correctly.

## Debugging Constraints
- Note: Our implementation replaces literal GPS browser navigation utilizing strictly native SDK permutations natively mapped inside `MapSearch.tsx`. 
- Ensure Android Studio tracks proper permissions mapping locations specifically over configurations seamlessly.

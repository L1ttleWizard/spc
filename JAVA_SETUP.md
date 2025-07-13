# Java Setup for Firebase Emulators

## Problem
Firebase emulators require Java 11 or higher, but you currently have Java 8 installed.

## Solution: Install Java 11+

### Option 1: Eclipse Temurin (Recommended)
1. Go to https://adoptium.net/
2. Download Eclipse Temurin JDK 11 or higher for Windows
3. Run the installer
4. Follow the installation wizard

### Option 2: Oracle JDK
1. Go to https://www.oracle.com/java/technologies/downloads/
2. Download JDK 11 or higher for Windows
3. Run the installer
4. Follow the installation wizard

## After Installation

1. **Verify Java version:**
   ```bash
   java -version
   ```
   Should show Java 11 or higher.

2. **Re-enable Firebase emulators:**
   - Edit `firebase.json` to uncomment the emulator configurations
   - Edit `src/lib/firebase.ts` and `src/lib/firebase-client.ts` to uncomment emulator connections

3. **Start emulators:**
   ```bash
   firebase emulators:start
   ```

## Current Status
- ✅ Firebase client/server configurations updated to not connect to emulators
- ✅ App will now connect to production Firebase services
- ⏳ Java 11+ installation needed to enable local emulators

## Benefits of Using Emulators
- Local development without affecting production data
- Faster development cycles
- No costs for Firebase usage during development
- Better testing capabilities 
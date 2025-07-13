// src/lib/firebase.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, doc, setDoc, getDoc, updateDoc, connectFirestoreEmulator } from 'firebase/firestore';

// Конфигурация Firebase, берется из переменных окружения
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Проверяем, было ли приложение уже инициализировано, чтобы избежать ошибок при Hot Reload в Next.js
// Если нет инициализированных приложений, создаем новое.
// Если есть, получаем ссылку на существующее.
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Получаем экземпляр сервиса аутентификации
const auth: Auth = getAuth(app);

// Получаем экземпляр Firestore
const db: Firestore = getFirestore(app);

// Connect to emulators in development
// Temporarily disabled due to Java version requirements
// if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
//   // Only connect to emulators on the server side
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099');
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     console.log('🔧 Connected to Firebase emulators');
//   } catch (error) {
//     console.log('ℹ️ Firebase emulators not running or already connected');
//   }
// }

// Interface for Spotify tokens
interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp when access token expires
  userId: string;
}

/**
 * Store Spotify tokens in Firestore for a user
 */
export async function storeSpotifyTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  try {
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    const tokenData: SpotifyTokens = {
      accessToken,
      refreshToken,
      expiresAt,
      userId,
    };

    await setDoc(doc(db, 'spotify_tokens', userId), tokenData);
    console.log('✅ Spotify tokens stored in Firestore for user:', userId);
  } catch (error) {
    console.error('❌ Error storing Spotify tokens in Firestore:', error);
    throw error;
  }
}

/**
 * Retrieve Spotify tokens from Firestore for a user
 */
export async function getSpotifyTokens(userId: string): Promise<SpotifyTokens | null> {
  try {
    const tokenDoc = await getDoc(doc(db, 'spotify_tokens', userId));
    
    if (tokenDoc.exists()) {
      const tokenData = tokenDoc.data() as SpotifyTokens;
      
      // Check if access token is still valid (with 5 minute buffer)
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      
      if (tokenData.expiresAt > now + bufferTime) {
        console.log('✅ Retrieved valid Spotify tokens from Firestore for user:', userId);
        return tokenData;
      } else {
        console.log('⚠️ Spotify tokens expired for user:', userId);
        return null;
      }
    }
    
    console.log('❌ No Spotify tokens found in Firestore for user:', userId);
    return null;
  } catch (error) {
    console.error('❌ Error retrieving Spotify tokens from Firestore:', error);
    return null;
  }
}

/**
 * Update Spotify tokens in Firestore (for token refresh)
 */
export async function updateSpotifyTokens(
  userId: string,
  accessToken: string,
  expiresIn: number
): Promise<void> {
  try {
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    await updateDoc(doc(db, 'spotify_tokens', userId), {
      accessToken,
      expiresAt,
    });
    
    console.log('✅ Spotify tokens updated in Firestore for user:', userId);
  } catch (error) {
    console.error('❌ Error updating Spotify tokens in Firestore:', error);
    throw error;
  }
}

/**
 * Delete Spotify tokens from Firestore (for logout)
 */
export async function deleteSpotifyTokens(userId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'spotify_tokens', userId), {});
    console.log('✅ Spotify tokens deleted from Firestore for user:', userId);
  } catch (error) {
    console.error('❌ Error deleting Spotify tokens from Firestore:', error);
    throw error;
  }
}

// Экспортируем сервисы для использования в других частях приложения
export { app, auth, db };
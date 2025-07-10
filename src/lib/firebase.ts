// src/lib/firebase.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// Для будущего использования, когда будем хранить refresh_token
// import { getFirestore, type Firestore } from 'firebase/firestore';

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

// Получаем экземпляр Firestore (пока закомментировано)
// const db: Firestore = getFirestore(app);

// Экспортируем сервисы для использования в других частях приложения
export { app, auth }; //, db };
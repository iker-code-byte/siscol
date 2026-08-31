import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  vapidKey
);

export const getFirebaseApp = () => {
  if (!isFirebaseConfigured) return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

export const requestFcmWebToken = async (serviceWorkerRegistration?: ServiceWorkerRegistration): Promise<string> => {
  if (!isFirebaseConfigured) {
    // Development / Mock fallback token
    console.info('[FCM] Variables de entorno VITE_FIREBASE_* no configuradas. Usando token de desarrollo.');
    return `dev_fcm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  try {
    const app = getFirebaseApp();
    if (!app) throw new Error('Firebase no inicializado.');

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });

    if (!token) {
      throw new Error('No se pudo obtener el token de registro de FCM.');
    }

    return token;
  } catch (err: any) {
    console.warn('[FCM] Error al contactar Firebase Messaging:', err);
    // Fallback in case of network issue with Firebase
    return `dev_fcm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};

export enum FirebaseEnvVar {
  API_KEY = 'VITE_FIREBASE_API_KEY',
  AUTH_DOMAIN = 'VITE_FIREBASE_AUTH_DOMAIN',
  PROJECT_ID = 'VITE_FIREBASE_PROJECT_ID',
  STORAGE_BUCKET = 'VITE_FIREBASE_STORAGE_BUCKET',
  MESSAGING_SENDER_ID = 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  APP_ID = 'VITE_FIREBASE_APP_ID',
  MEASUREMENT_ID = 'VITE_FIREBASE_MEASUREMENT_ID'
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}
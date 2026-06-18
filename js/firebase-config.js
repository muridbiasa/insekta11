import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FIREBASE_ENV_ENDPOINTS = [
  "/api/firebase-env",
  "/.netlify/functions/firebase-env"
];

async function loadFirebaseEnv() {
  let lastError;

  for (const endpoint of FIREBASE_ENV_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (response.ok) return await response.json();
      lastError = new Error(`[Firebase] ${endpoint} returned ${response.status} ${response.statusText}.`);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`[Firebase] Gagal memuat config dari server environment. ${lastError?.message ?? ""}`);
}

function getRequiredEnv(env, key) {
  const value = env[key];
  if (!value) {
    throw new Error(`[Firebase] ${key} tidak ditemukan di server environment.`);
  }
  return value;
}

const env = await loadFirebaseEnv();
const firebaseConfig = {
  apiKey: getRequiredEnv(env, "apiKey"),
  authDomain: getRequiredEnv(env, "authDomain"),
  projectId: getRequiredEnv(env, "projectId"),
  storageBucket: getRequiredEnv(env, "storageBucket"),
  messagingSenderId: getRequiredEnv(env, "messagingSenderId"),
  appId: getRequiredEnv(env, "appId")
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
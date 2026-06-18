import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function parseDotEnv(text) {
  return text.split(/\r?\n/).reduce((env, line) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("#")) return env;

    const separatorIndex = cleanLine.indexOf("=");
    if (separatorIndex === -1) return env;

    const key = cleanLine.slice(0, separatorIndex).trim();
    const value = cleanLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key) env[key] = value;

    return env;
  }, {});
}

async function loadFirebaseEnv() {
  if (window.location.protocol === "file:") {
    throw new Error("[Firebase] js/.env tidak bisa dibaca lewat file://. Jalankan app melalui local server.");
  }

  const response = await fetch("./js/.env", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`[Firebase] Gagal memuat js/.env (${response.status} ${response.statusText}).`);
  }

  return parseDotEnv(await response.text());
}

function getRequiredEnv(env, key) {
  const value = env[key];
  if (!value) {
    throw new Error(`[Firebase] ${key} tidak ditemukan di js/.env.`);
  }
  return value;
}

const env = await loadFirebaseEnv();
const firebaseConfig = {
  apiKey: getRequiredEnv(env, "FIREBASE_API_KEY"),
  authDomain: getRequiredEnv(env, "FIREBASE_AUTH_DOMAIN"),
  projectId: getRequiredEnv(env, "FIREBASE_PROJECT_ID"),
  storageBucket: getRequiredEnv(env, "FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getRequiredEnv(env, "FIREBASE_MESSAGING_SENDER_ID"),
  appId: getRequiredEnv(env, "FIREBASE_APP_ID")
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
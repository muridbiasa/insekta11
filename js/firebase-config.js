import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================================
// KONFIGURASI FIREBASE STANDARD
// ============================================================================
// Anda dapat memasukkan API Key dan data Firebase Anda langsung di bawah ini.
// Atau, jika Anda menaruh config di index.html, script ini juga mendukung fallback
// ke `window.firebaseConfig`.
// ============================================================================

const defaultFirebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY", // MASUKKAN API KEY DI SINI
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN", // MASUKKAN AUTH DOMAIN DI SINI
  projectId: "YOUR_FIREBASE_PROJECT_ID", // MASUKKAN PROJECT ID DI SINI
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET", // MASUKKAN STORAGE BUCKET DI SINI
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID", // MASUKKAN SENDER ID DI SINI
  appId: "YOUR_FIREBASE_APP_ID" // MASUKKAN APP ID DI SINI
};

// Gunakan window.firebaseConfig jika tersedia, jika tidak gunakan default di atas
const firebaseConfig = window.firebaseConfig || defaultFirebaseConfig;

// Validasi sederhana sebelum inisialisasi
if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY") {
  console.warn(
    "[INSEKTA 11] Firebase API Key belum diisi atau masih menggunakan placeholder. " +
    "Silakan isi kredensial Firebase Anda di js/firebase-config.js atau definisikan window.firebaseConfig."
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

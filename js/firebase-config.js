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

// Gunakan window.firebaseConfig jika tersedia, jika tidak gunakan null agar bisa dicoba fetch/import
let firebaseConfig = window.firebaseConfig || null;

// 1. Coba import secara dinamis dari js/firebase-env.js jika ada
if (!firebaseConfig) {
  try {
    const envMod = await import('./firebase-env.js');
    if (envMod && envMod.firebaseConfig) {
      firebaseConfig = envMod.firebaseConfig;
      console.log("[INSEKTA 11] Menggunakan konfigurasi dari js/firebase-env.js");
    }
  } catch (e) {
    // Abaikan jika file tidak ada atau error
  }
}

// 2. Jika config masih kosong atau masih berupa placeholder, ambil secara dinamis dari API /api/firebase-env (.env Vercel / Netlify / Local Server)
if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY" || firebaseConfig.apiKey === "YOUR_API_KEY") {
  try {
    const res = await fetch('/api/firebase-env');
    if (res.ok) {
      const data = await res.json();
      if (data && data.apiKey) {
        firebaseConfig = data;
        console.log("[INSEKTA 11] Berhasil mengambil konfigurasi Firebase dari .env via /api/firebase-env");
      } else if (data && data.error) {
        console.warn("[INSEKTA 11] Endpoint /api/firebase-env mengembalikan error:", data.error, data.missing);
      }
    } else {
      console.warn("[INSEKTA 11] Endpoint /api/firebase-env merespon dengan status:", res.status);
    }
  } catch (e) {
    console.warn("[INSEKTA 11] Gagal mengambil konfigurasi dari /api/firebase-env:", e);
  }
}

// 3. Fallback ke default jika tidak berhasil dimuat dari mana pun
if (!firebaseConfig) {
  firebaseConfig = defaultFirebaseConfig;
}

// Validasi sederhana sebelum inisialisasi
if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY" || firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.warn(
    "[INSEKTA 11] Firebase API Key belum diisi atau masih menggunakan placeholder. " +
    "Silakan isi kredensial Firebase Anda di Vercel/Netlify Environment Variables atau definisikan di js/firebase-config.js."
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


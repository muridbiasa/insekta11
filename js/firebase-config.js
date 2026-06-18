// ============================================================
// js/firebase-config.js
// Inisialisasi Firebase App & Firestore — SDK v9 Modular
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️  GANTI DENGAN KONFIGURASI FIREBASE ANDA (dari Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCwidxJAw82-MSOmPYv903-T6BK91zbEFo",
  authDomain: "insekta11.firebaseapp.com",
  projectId: "insekta11",
  storageBucket: "insekta11.firebasestorage.app",
  messagingSenderId: "885267046059",
  appId: "1:885267046059:web:67839904f19f9cfbd921ee"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
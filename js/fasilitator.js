// ============================================================
// js/fasilitator.js
// ✅ VERSI FIXED — Semua logika Firebase terintegrasi di sini.
//    File ini di-import oleh index.html via <script type="module">
// ============================================================

import { db } from './firebase-config.js';
import { daftarSiswa } from './data-siswa.js';
import {
  doc, setDoc, getDoc, updateDoc, increment, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// ADAPTER — konversi flat array → object map untuk renderUI
// window.dataSiswa   = { "KELOMPOK A": [...], "KELOMPOK B": [...] }
// window.daftarKelompok = ["KELOMPOK A", "KELOMPOK B", ...]
// ============================================================
window.dataSiswa = daftarSiswa.reduce((acc, siswa) => {
  if (!acc[siswa.kelompok]) acc[siswa.kelompok] = [];
  acc[siswa.kelompok].push(siswa);
  return acc;
}, {});
window.daftarKelompok = Object.keys(window.dataSiswa).sort();

// ============================================================
// SIMPAN PELANGGARAN KE FIRESTORE
// Dipanggil dari event handler di index.html
// ============================================================
window.simpanPelanggaranFirebase = async function(payload) {
  const {
    doc_id, nomor_absen, nama_lengkap, kelompok,
    hari, kategori, komentar, fasilitator
  } = payload;

  const kejadianId = `kejadian_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const waktuInput = new Date().toISOString();

  const kejadianData = { hari, kategori, komentar: komentar || '', waktu_input: waktuInput, fasilitator };

  try {
    const docRef = doc(db, "rekap_pelanggaran", doc_id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        [`riwayat.${kejadianId}`]: kejadianData,
        total_pelanggaran: increment(1)
      });
    } else {
      await setDoc(docRef, {
        nomor_absen,
        nama_lengkap,
        kelompok,
        total_pelanggaran: 1,
        riwayat: { [kejadianId]: kejadianData }
      });
    }

    // Simpan ke localStorage untuk fitur riwayat & hapus
    const riwayatLokal = JSON.parse(localStorage.getItem('riwayat_input') || '[]');
    riwayatLokal.push({
      doc_id,
      kejadian_id: kejadianId,
      nama: nama_lengkap,
      kategori: kategori.join(', '),
      waktu: waktuInput
    });
    localStorage.setItem('riwayat_input', JSON.stringify(riwayatLokal));

    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error saving:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// HAPUS PELANGGARAN DARI FIRESTORE
// ============================================================
window.hapusPelanggaranFirebase = async function(docId, kejadianId, lokalIndex) {
  try {
    const docRef = doc(db, "rekap_pelanggaran", docId);
    await updateDoc(docRef, {
      [`riwayat.${kejadianId}`]: deleteField(),
      total_pelanggaran: increment(-1)
    });

    const riwayatLokal = JSON.parse(localStorage.getItem('riwayat_input') || '[]');
    riwayatLokal.splice(lokalIndex, 1);
    localStorage.setItem('riwayat_input', JSON.stringify(riwayatLokal));

    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error deleting:", error);
    return { success: false, error: error.message };
  }
};
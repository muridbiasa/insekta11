// js/fasilitator.js
import { db } from './firebase-config.js';
import { daftarSiswa } from './data-siswa.js';
import { doc, setDoc, getDoc, updateDoc, increment, deleteField } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const setupContainer = document.getElementById('setup-container');
const gridKelompok = document.getElementById('grid-kelompok');
const btnMulai = document.getElementById('btn-mulai');
const btnRiwayat = document.getElementById('btn-riwayat');
const selectHari = document.getElementById('select-hari');
const inputNama = document.getElementById('input-nama');

const modalInput = document.getElementById('modal-input');
const modalNama = document.getElementById('modal-nama');
const modalKelompok = document.getElementById('modal-kelompok');
const inputKomentar = document.getElementById('input-komentar');
const btnSimpan = document.getElementById('btn-simpan');
const btnBatal = document.getElementById('btn-batal');

const modalRiwayat = document.getElementById('modal-riwayat');
const listRiwayat = document.getElementById('list-riwayat');
const btnTutupRiwayat = document.getElementById('btn-tutup-riwayat');

let currentSiswa = null;

function init() {
    const savedNama = localStorage.getItem('fasilitator_nama');
    const savedHari = localStorage.getItem('fasilitator_hari');
    
    if (savedNama && savedHari) {
        inputNama.value = savedNama;
        selectHari.value = savedHari;
        showGridKelompok();
    }

    btnMulai.addEventListener('click', () => {
        const nama = inputNama.value.trim();
        const hari = selectHari.value;
        if (!nama) return alert('Nama Fasilitator harus diisi!');
        localStorage.setItem('fasilitator_nama', nama);
        localStorage.setItem('fasilitator_hari', hari);
        showGridKelompok();
    });

    btnRiwayat.addEventListener('click', showRiwayat);
    btnTutupRiwayat.addEventListener('click', () => modalRiwayat.classList.remove('active'));
    btnBatal.addEventListener('click', () => modalInput.classList.remove('active'));
    btnSimpan.addEventListener('click', simpanPelanggaran);
}

function showGridKelompok() {
    setupContainer.classList.add('hidden');
    gridKelompok.classList.remove('hidden');
    gridKelompok.innerHTML = `<h2 class="text-xl font-bold mb-4 text-center text-blue-400">Pilih Kelompok</h2><div class="grid grid-cols-3 md:grid-cols-4 gap-4"></div>`;
    const grid = gridKelompok.querySelector('div');
    
    // Ambil unique kelompok dari data siswa
    const kelompokList = [...new Set(daftarSiswa.map(s => s.kelompok))].sort();
    
    kelompokList.forEach(kelompok => {
        const huruf = kelompok.split(' ')[1]; 
        const btn = document.createElement('button');
        btn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow transition';
        btn.textContent = `Kelompok ${huruf}`;
        btn.onclick = () => showDaftarSiswa(kelompok);
        grid.appendChild(btn);
    });
}

function showDaftarSiswa(namaKelompok) {
    const siswaList = daftarSiswa.filter(s => s.kelompok === namaKelompok);
    gridKelompok.innerHTML = `<button id="btn-kembali" class="mb-4 text-blue-400 hover:underline">⬅ Kembali</button><h2 class="text-xl font-bold mb-4 text-center text-blue-400">Daftar Siswa ${namaKelompok}</h2><div class="grid grid-cols-1 gap-3"></div>`;
    const grid = gridKelompok.querySelector('div');
    document.getElementById('btn-kembali').onclick = showGridKelompok;

    siswaList.forEach(s => {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center';
        card.innerHTML = `<span class="font-semibold">${s.nomor_absen}. ${s.nama_lengkap}</span><button class="btn-input bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded" data-id="${s.id}" data-nama="${s.nama_lengkap}" data-kelompok="${s.kelompok}">Input</button>`;
        card.querySelector('.btn-input').onclick = (e) => openModalInput(e.target.dataset.id, e.target.dataset.nama, e.target.dataset.kelompok);
        grid.appendChild(card);
    });
}

function openModalInput(id, nama, kelompok) {
    currentSiswa = { id, nama_lengkap: nama, kelompok };
    modalNama.textContent = nama;
    modalKelompok.textContent = kelompok;
    inputKomentar.value = '';
    document.querySelectorAll('.kategori-cb').forEach(cb => cb.checked = false);
    modalInput.classList.add('active');
}

async function simpanPelanggaran() {
    const kategori = Array.from(document.querySelectorAll('.kategori-cb:checked')).map(cb => cb.value);
    const komentar = inputKomentar.value.trim();
    const hari = localStorage.getItem('fasilitator_hari');
    const fasilitator = localStorage.getItem('fasilitator_nama');

    if (kategori.length === 0) return alert('Pilih minimal 1 kategori pelanggaran!');

    const kejadianId = `kejadian_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const waktuInput = new Date().toISOString();
    
    // Struktur data baru sesuai PRD (Object Map)
    const dataBaru = { [kejadianId]: { hari, kategori, komentar, waktu_input: waktuInput, fasilitator } };

    try {
        const docRef = doc(db, "rekap_pelanggaran", currentSiswa.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Update existing document
            await updateDoc(docRef, {
                [`riwayat.${kejadianId}`]: dataBaru[kejadianId],
                total_pelanggaran: increment(1)
            });
        } else {
            // Create new document
            await setDoc(docRef, {
                nomor_absen: currentSiswa.id.split('_')[2], // Ambil nomor absen dari ID
                nama_lengkap: currentSiswa.nama_lengkap,
                kelompok: currentSiswa.kelompok,
                total_pelanggaran: 1,
                riwayat: dataBaru
            });
        }

        // Simpan ke LocalStorage untuk fitur "Hapus Input Saya"
        let riwayatLokal = JSON.parse(localStorage.getItem('riwayat_input') || '[]');
        riwayatLokal.push({ 
            doc_id: currentSiswa.id, 
            kejadian_id: kejadianId, 
            nama: currentSiswa.nama_lengkap, 
            kategori: kategori.join(', '), 
            waktu: waktuInput 
        });
        localStorage.setItem('riwayat_input', JSON.stringify(riwayatLokal));

        modalInput.classList.remove('active');
        alert('✅ Pelanggaran berhasil disimpan ke Firebase!');
    } catch (error) {
        console.error("Error saving: ", error);
        alert('❌ Gagal menyimpan data. Cek Console (F12) untuk detail error.');
    }
}

function showRiwayat() {
    const riwayatLokal = JSON.parse(localStorage.getItem('riwayat_input') || '[]');
    listRiwayat.innerHTML = '';
    if (riwayatLokal.length === 0) {
        listRiwayat.innerHTML = '<p class="text-gray-400 text-center">Belum ada riwayat input.</p>';
    } else {
        // Tampilkan urutan terbaru di atas
        riwayatLokal.slice().reverse().forEach((item, index) => {
            const originalIndex = riwayatLokal.length - 1 - index;
            const card = document.createElement('div');
            card.className = 'bg-gray-700 p-3 rounded border border-gray-600';
            card.innerHTML = `
                <p class="font-bold text-blue-300">${item.nama}</p>
                <p class="text-sm text-gray-300">${item.kategori}</p>
                <p class="text-xs text-gray-400 mb-2">${new Date(item.waktu).toLocaleString('id-ID')}</p>
                <button class="btn-hapus bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded" data-doc="${item.doc_id}" data-kejadian="${item.kejadian_id}" data-index="${originalIndex}">Hapus</button>
            `;
            card.querySelector('.btn-hapus').onclick = (e) => hapusPelanggaran(e.target.dataset.doc, e.target.dataset.kejadian, parseInt(e.target.dataset.index));
            listRiwayat.appendChild(card);
        });
    }
    modalRiwayat.classList.add('active');
}

async function hapusPelanggaran(docId, kejadianId, lokalIndex) {
    if (!confirm('Yakin ingin menghapus data pelanggaran ini dari Firebase?')) return;
    try {
        const docRef = doc(db, "rekap_pelanggaran", docId);
        
        // Hapus key dari object riwayat dan decrement total
        await updateDoc(docRef, {
            [`riwayat.${kejadianId}`]: deleteField(),
            total_pelanggaran: increment(-1)
        });

        // Hapus dari localStorage
        let riwayatLokal = JSON.parse(localStorage.getItem('riwayat_input') || '[]');
        riwayatLokal.splice(lokalIndex, 1);
        localStorage.setItem('riwayat_input', JSON.stringify(riwayatLokal));
        
        showRiwayat(); // Refresh tampilan modal
        alert('Data berhasil dihapus!');
    } catch (error) {
        console.error("Error deleting: ", error);
        alert('Gagal menghapus data.');
    }
}

init();
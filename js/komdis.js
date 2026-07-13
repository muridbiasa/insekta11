// js/komdis.js
import { db } from './firebase-config.js';
import { daftarSiswa } from './data-siswa.js';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteField, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// ADAPTER — konversi flat array → object map untuk renderUI
// ============================================================
const dataSiswa = daftarSiswa.reduce((acc, siswa) => {
    if (!acc[siswa.kelompok]) acc[siswa.kelompok] = [];
    acc[siswa.kelompok].push(siswa);
    return acc;
}, {});
const daftarKelompok = Object.keys(dataSiswa).sort();

// ============================================================
// DOM ELEMENTS
// ============================================================
const gatekeeper = document.getElementById('gatekeeper');
const dashboardContainer = document.getElementById('dashboard-container');
const btnLogin = document.getElementById('btn-login');
const inputPassword = document.getElementById('input-password');
const errorMsg = document.getElementById('error-msg');
const gridCards = document.getElementById('grid-cards');
const btnExport = document.getElementById('btn-export');
const filterKelompokOptions = document.getElementById('filter-kelompok-options');
const inputSearchDashboard = document.getElementById('input-search-dashboard');
const statSiswa = document.getElementById('stat-siswa');
const statKejadian = document.getElementById('stat-kejadian');
const modalDetail = document.getElementById('modal-detail');
const detailNama = document.getElementById('detail-nama');
const detailTimeline = document.getElementById('detail-timeline');
const btnTutupDetail = document.getElementById('btn-tutup-detail');
const modalRevoke = document.getElementById('modal-revoke');
const btnBatalRevoke = document.getElementById('btn-batal-revoke');
const btnKonfirmasiRevoke = document.getElementById('btn-konfirmasi-revoke');

let allData = [];
let currentSearch = "";
let currentRevokeTarget = null;
const selectedHari = new Set();
const selectedKategori = new Set();
const selectedKelompok = new Set();

// 1. Gatekeeper Logic
btnLogin.addEventListener('click', () => {
    if (inputPassword.value === 'admin123') {
        gatekeeper.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        initDashboard();
    } else {
        errorMsg.classList.remove('hidden');
        inputPassword.value = '';
    }
});

inputPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnLogin.click();
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.filter-dropdown')) return;

    document.querySelectorAll('.filter-dropdown[open]').forEach(details => details.removeAttribute('open'));
});

// 2. Dashboard Initialization & Real-time Listener
function initDashboard() {
    // Query hanya siswa yang total_pelanggarannya > 0
    const q = query(collection(db, "rekap_pelanggaran"), where("total_pelanggaran", ">", 0));
    
    onSnapshot(q, (snapshot) => {
        allData = [];
        snapshot.forEach((doc) => {
            allData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by Kelompok dan Nomor Absen
        allData.sort((a, b) => {
            if (a.kelompok === b.kelompok) {
                return a.nomor_absen.localeCompare(b.nomor_absen);
            }
            return a.kelompok.localeCompare(b.kelompok);
        });
        renderDashboard();
    }, (error) => {
        console.error("Error listening to data: ", error);
        gridCards.innerHTML = '<p class="text-red-400 col-span-full text-center py-10">Gagal memuat data. Periksa Firebase Rules atau koneksi.</p>';
    });

    populateFilterOptions();
    updateDropdownSummaries();

    dashboardContainer.addEventListener('change', (e) => {
        if (!e.target.matches('.filter-hari, .filter-kategori, .filter-kelompok')) return;

        updateSelectedFilters();
        updateDropdownSummaries();
        renderDashboard();
    });

    inputSearchDashboard.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim().toLowerCase();
        renderDashboard();
    });

    btnExport.addEventListener('click', exportExcel);
    btnTutupDetail.addEventListener('click', () => modalDetail.classList.remove('active'));
    btnBatalRevoke.addEventListener('click', closeRevokeModal);
    btnKonfirmasiRevoke.addEventListener('click', confirmRevokePelanggaran);
    detailTimeline.addEventListener('click', handleTimelineClick);
    modalDetail.addEventListener('click', (e) => {
        if (e.target === modalDetail) modalDetail.classList.remove('active');
    });
    modalRevoke.addEventListener('click', (e) => {
        if (e.target === modalRevoke) closeRevokeModal();
    });
}

// 3. Render Dashboard
function renderDashboard() {
    gridCards.innerHTML = '';
    
    const filteredData = getFilteredData();

    // Update Stats
    statSiswa.textContent = filteredData.length;
    let totalKejadian = 0;
    filteredData.forEach(s => {
        totalKejadian += getFilteredRiwayat(s).length;
    });
    statKejadian.textContent = totalKejadian;

    // EMPTY STATE
    if (filteredData.length === 0) {
        gridCards.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Belum ada data pelanggaran yang cocok dengan filter.</p>';
        return;
    }

    // Render Cards Grouped by Kelompok (Adapter Implementation)
    daftarKelompok.forEach(kelompok => {
        const siswaDiKelompokIni = filteredData.filter(s => s.kelompok === kelompok);
        
        if (siswaDiKelompokIni.length > 0) {
            const groupHeader = document.createElement('h2');
            groupHeader.className = 'col-span-full text-xl font-bold text-blue-400 mt-6 mb-2 border-b border-gray-700 pb-2';
            groupHeader.textContent = kelompok;
            gridCards.appendChild(groupHeader);

            siswaDiKelompokIni.forEach(s => {
                const kejadianCount = getFilteredRiwayat(s).length;
                
                const card = document.createElement('div');
                card.className = 'bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-red-500 transition cursor-pointer shadow-lg';
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-bold text-lg text-white">${s.nama_lengkap}</h3>
                            <p class="text-sm text-gray-400">${s.kelompok} • No. ${s.nomor_absen}</p>
                        </div>
                        <span class="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">${kejadianCount}</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-4">
                        ${getKategoriBadges(s)}
                    </div>
                `;
                card.onclick = () => showDetail(s);
                gridCards.appendChild(card);
            });
        }
    });
}
//mengambil data dan mencocokan dengan filter
function getFilteredData() {
    return allData.filter(siswa => {
        const riwayatSiswa = getFilteredRiwayat(siswa);
        const matchesHari = selectedHari.size === 0 || riwayatSiswa.length > 0;
        const matchesKategori = selectedKategori.size === 0 || riwayatSiswa.length > 0;
        const matchesKelompok = selectedKelompok.size === 0 || selectedKelompok.has(siswa.kelompok);
        const matchesNama = !currentSearch || siswa.nama_lengkap.toLowerCase().includes(currentSearch);
        return matchesHari && matchesKategori && matchesKelompok && matchesNama;
    });
}

function getFilteredRiwayat(siswa) {
    return Object.values(siswa.riwayat || {}).filter(matchesRiwayatFilter);
}

function matchesRiwayatFilter(r) {
    const matchesHari = selectedHari.size === 0 || r.hari && selectedHari.has(r.hari);
    const matchesKategori = selectedKategori.size === 0 || (Array.isArray(r.kategori) && r.kategori.some(cat => selectedKategori.has(cat)));
    return matchesHari && matchesKategori;
}
//checker logic
function updateSelectedFilters() {
    selectedHari.clear();
    selectedKategori.clear();
    selectedKelompok.clear();

    document.querySelectorAll('.filter-hari:checked').forEach(input => selectedHari.add(input.value));
    document.querySelectorAll('.filter-kategori:checked').forEach(input => selectedKategori.add(input.value));
    document.querySelectorAll('.filter-kelompok:checked').forEach(input => selectedKelompok.add(input.value));
}

function updateDropdownSummaries() {
    document.querySelectorAll('.filter-dropdown').forEach(details => {
        const group = details.dataset.filterGroup;
        const checkedInputs = Array.from(document.querySelectorAll(`.filter-${group}:checked`));
        const summary = details.querySelector('[data-filter-summary]');
        const defaultLabel = details.dataset.defaultLabel;

        if (!summary) return;

        summary.textContent = checkedInputs.length === 0
            ? defaultLabel
            : checkedInputs.map(input => input.dataset.label || input.value).join(', ');
    });
}

function populateFilterOptions() {
    filterKelompokOptions.innerHTML = daftarKelompok.map(kelompok => `
        <label class="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-gray-200 cursor-pointer hover:bg-gray-800">
            <input type="checkbox" class="filter-kelompok accent-blue-500" value="${escapeHtml(kelompok)}">
            <span>${escapeHtml(kelompok)}</span>
        </label>
    `).join('');
}

function getKategoriBadges(siswa) {
    const kategoriSet = new Set();
    getFilteredRiwayat(siswa).forEach(r => {
        if (!Array.isArray(r.kategori)) return;
        r.kategori.forEach(cat => kategoriSet.add(cat));
    });
    return Array.from(kategoriSet).map(cat => 
        `<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">${escapeHtml(cat)}</span>`
    ).join('');
}

// 4. Show Detail Modal
function showDetail(s) {
    detailNama.textContent = `${s.nama_lengkap} (${s.kelompok})`;
    detailTimeline.dataset.siswaId = s.id;
    detailTimeline.innerHTML = '';
    const riwayat = s.riwayat || {};
    let riwayatArray = Object.entries(riwayat)
        .map(([id, data]) => ({ id, ...data }))
        .filter(matchesRiwayatFilter);

    // Sort by waktu_input descending (terbaru di atas)
    riwayatArray.sort((a, b) => new Date(b.waktu_input) - new Date(a.waktu_input));
//Revoke button and History Ui
    if (riwayatArray.length === 0) {
        detailTimeline.innerHTML = '<p class="text-gray-500 text-center">Tidak ada riwayat.</p>';
    } else {
        riwayatArray.forEach(r => {
            const item = document.createElement('div');
            item.className = 'bg-gray-900 p-4 rounded-lg border-l-4 border-red-500';
            const tgl = new Date(r.waktu_input).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const kategori = Array.isArray(r.kategori) ? r.kategori : [];
            item.innerHTML = `
                <div class="flex justify-between items-start gap-3 mb-2">
                    <div>
                        <span class="font-bold text-blue-400">${escapeHtml(r.hari)}</span>
                        <span class="text-xs text-gray-500 block mt-1">${tgl}</span>
                    </div>
                    <button type="button" class="revoke-btn shrink-0 text-xs font-bold text-red-300 hover:text-red-100 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition" data-kejadian-id="${escapeHtml(r.id)}">
                        Hapus
                    </button>
                </div>
                <div class="flex flex-wrap gap-2 mb-2">
                    ${kategori.map(cat => `<span class="bg-red-900 text-red-200 text-xs px-2 py-1 rounded">${escapeHtml(cat)}</span>`).join('')}
                </div>
                <p class="text-sm text-gray-300 italic mb-2">"${escapeHtml(r.komentar || 'Tidak ada komentar')}"</p>
                <p class="text-xs text-gray-500">Dicatat oleh: ${escapeHtml(r.fasilitator)}</p>
            `;
            detailTimeline.appendChild(item);
        });
    }
    modalDetail.classList.add('active');
}
//function modal revoke
function handleTimelineClick(e) {
    const revokeButton = e.target.closest('.revoke-btn');
    if (!revokeButton) return;

    openRevokeModal(detailTimeline.dataset.siswaId, revokeButton.dataset.kejadianId);
}

function openRevokeModal(siswaId, kejadianId) {
    if (!siswaId || !kejadianId) return;

    currentRevokeTarget = { siswaId, kejadianId };
    modalRevoke.classList.remove('hidden');
}

function closeRevokeModal() {
    currentRevokeTarget = null;
    modalRevoke.classList.add('hidden');
}

async function confirmRevokePelanggaran() {
    if (!currentRevokeTarget) return;

    const { siswaId, kejadianId } = currentRevokeTarget;
    const siswaIndex = allData.findIndex(s => s.id === siswaId);
    const siswa = allData[siswaIndex];

    if (!siswa) {
        closeRevokeModal();
        return;
    }

//Hapus pelanggaran dari database via remove docref
    const totalPelanggaran = Number(siswa.total_pelanggaran || 0);
    const docRef = doc(db, "rekap_pelanggaran", siswaId);

    try {
        btnKonfirmasiRevoke.disabled = true;
        btnKonfirmasiRevoke.classList.add('opacity-50', 'cursor-not-allowed');

        if (totalPelanggaran <= 1) {
            await deleteDoc(docRef);
        } else {
            await updateDoc(docRef, {
                [`riwayat.${kejadianId}`]: deleteField(),
                total_pelanggaran: increment(-1)
            });
        }

        removeLocalRevokeRecord(siswaId, kejadianId);
        updateLocalDataAfterRevoke(siswaIndex, totalPelanggaran, kejadianId);
        closeRevokeModal();
        renderDashboard();

        const updatedSiswa = allData.find(s => s.id === siswaId);
        if (updatedSiswa && getFilteredRiwayat(updatedSiswa).length > 0) {
            showDetail(updatedSiswa);
        } else {
            modalDetail.classList.remove('active');
        }
    } catch (error) {
        console.error("[Firestore] Error revoking violation:", error);
        alert('Gagal menghapus pelanggaran. Coba lagi.');
    } finally {
        btnKonfirmasiRevoke.disabled = false;
        btnKonfirmasiRevoke.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function updateLocalDataAfterRevoke(siswaIndex, totalPelanggaran, kejadianId) {
    if (siswaIndex === -1) return;

    if (totalPelanggaran <= 1) {
        allData.splice(siswaIndex, 1);
        return;
    }

    const siswa = allData[siswaIndex];
    if (siswa.riwayat) delete siswa.riwayat[kejadianId];
    siswa.total_pelanggaran = Math.max(0, totalPelanggaran - 1);
}

function removeLocalRevokeRecord(siswaId, kejadianId) {
    try {
        const riwayatLokal = JSON.parse(localStorage.getItem('riwayat_input') || '[]');
        const filteredRiwayat = riwayatLokal.filter(item => !(item.doc_id === siswaId && item.kejadian_id === kejadianId));
        localStorage.setItem('riwayat_input', JSON.stringify(filteredRiwayat));
    } catch (error) {
        console.warn("[LocalStorage] Gagal membersihkan riwayat lokal:", error);
    }
}

// 5. Export Excel
function exportExcel() {
    const dataToExport = getFilteredData();
    if (dataToExport.length === 0) return alert('Tidak ada data untuk diekspor.');

    const headers = [
        "No Absen",
        "Nama Lengkap",
        "Kelompok",
        "Total Pelanggaran",
        "Pelanggaran Hari 1",
        "Pelanggaran Hari 2",
        "Pelanggaran Hari 3",
        "Pelanggaran Hari 4",
        "Pelanggaran Hari 5",
        "Pelanggaran Hari 6"
    ];

    const rows = dataToExport.map(siswa => {
        const riwayat = getFilteredRiwayat(siswa);

        return [
            { value: siswa.nomor_absen, style: 'text-align:center;mso-number-format:"\\@";' },
            { value: siswa.nama_lengkap },
            { value: siswa.kelompok, style: 'text-align:center;' },
            { value: riwayat.length, style: 'text-align:center;font-weight:bold;' },
            { value: formatRiwayatHari(riwayat, "Hari 1") },
            { value: formatRiwayatHari(riwayat, "Hari 2") },
            { value: formatRiwayatHari(riwayat, "Hari 3") },
            { value: formatRiwayatHari(riwayat, "Hari 4") },
            { value: formatRiwayatHari(riwayat, "Hari 5") },
            { value: formatRiwayatHari(riwayat, "Hari 6") }
        ];
    });

    const exportedAt = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const dateSlug = new Date().toISOString().split('T')[0];

    // Menggunakan library SheetJS (XLSX) yang sudah di-load lewat CDN di dashboard.html
    const XLSX = window.XLSX;
    if (!XLSX) {
        alert("Library Excel (SheetJS) belum siap. Silakan coba lagi dalam beberapa saat.");
        return;
    }

    // Bangun susunan data untuk Worksheet
    const aoa = [
        ["Rekap Pelanggaran INSEKTA 11"],
        [`Diekspor pada: ${exportedAt}`],
        [], // Baris kosong sebagai pembatas
        headers, // Baris header tabel
        ...rows.map(row => row.map(cell => cell.value)) // Baris data
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Set tipe data No Absen menjadi String ('s') agar nomor absen (seperti "01", "02") tidak kehilangan nol di depan
    for (let r = 0; r < rows.length; r++) {
        const cellAddress = `A${r + 5}`; // Baris data dimulai dari index ke-5 (1-based: baris 5)
        if (ws[cellAddress]) {
            ws[cellAddress].t = 's';
        }
    }

    // Atur lebar kolom secara dinamis agar pas dengan kontennya
    const colWidths = headers.map((header, colIndex) => {
        let maxLen = header.length;
        rows.forEach(row => {
            const val = String(row[colIndex]?.value ?? '');
            if (val.length > maxLen) {
                maxLen = val.length;
            }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
    });
    ws['!cols'] = colWidths;

    // Buat workbook baru dan lampirkan worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Pelanggaran");

    // Unduh file secara instan sebagai berkas XLSX asli (native binary)
    XLSX.writeFile(wb, `Rekap_Pelanggaran_INSEKTA11_${dateSlug}.xlsx`);
}

function formatRiwayatHari(riwayat, hari) {
    const items = riwayat
        .filter(r => r.hari === hari)
        .map(r => {
            const kategori = Array.isArray(r.kategori) && r.kategori.length > 0 ? r.kategori.join(' + ') : 'Tidak ada kategori';
            const komentar = r.komentar ? ` - ${r.komentar}` : '';
            return `${kategori}${komentar}`;
        });

    return items.length > 0 ? items.join(' | ') : '—';
}

function renderExcelCell(value, extraStyle = '') {
    return `<td style="border:1px solid #cbd5e1;padding:8px;vertical-align:top;${extraStyle}">${escapeHtml(value)}</td>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
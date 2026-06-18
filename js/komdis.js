// js/komdis.js
import { db } from './firebase-config.js';
import { daftarSiswa } from './data-siswa.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const statSiswa = document.getElementById('stat-siswa');
const statKejadian = document.getElementById('stat-kejadian');
const modalDetail = document.getElementById('modal-detail');
const detailNama = document.getElementById('detail-nama');
const detailTimeline = document.getElementById('detail-timeline');
const btnTutupDetail = document.getElementById('btn-tutup-detail');

let allData = [];
let currentFilter = "Semua";

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

    // Filter Listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-blue-600');
                b.classList.add('bg-gray-700');
            });
            e.target.classList.remove('bg-gray-700');
            e.target.classList.add('bg-blue-600');
            currentFilter = e.target.dataset.filter;
            renderDashboard();
        });
    });

    btnExport.addEventListener('click', exportExcel);
    btnTutupDetail.addEventListener('click', () => modalDetail.classList.remove('active'));
    modalDetail.addEventListener('click', (e) => {
        if (e.target === modalDetail) modalDetail.classList.remove('active');
    });
}

// 3. Render Dashboard
function renderDashboard() {
    gridCards.innerHTML = '';
    
    const filteredData = allData.filter(s => {
        if (currentFilter === "Semua") return true;
        const riwayat = s.riwayat || {};
        return Object.values(riwayat).some(r => r.hari === currentFilter);
    });

    // Update Stats
    statSiswa.textContent = filteredData.length;
    let totalKejadian = 0;
    filteredData.forEach(s => {
        const riwayat = s.riwayat || {};
        const kejadian = Object.values(riwayat).filter(r => currentFilter === "Semua" || r.hari === currentFilter);
        totalKejadian += kejadian.length;
    });
    statKejadian.textContent = totalKejadian;

    // EMPTY STATE
    if (filteredData.length === 0) {
        gridCards.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Belum ada data pelanggaran. Silakan input dari halaman Fasilitator.</p>';
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
                const riwayat = s.riwayat || {};
                const kejadianCount = Object.values(riwayat).filter(r => currentFilter === "Semua" || r.hari === currentFilter).length;
                
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
                        ${getKategoriBadges(s, currentFilter)}
                    </div>
                `;
                card.onclick = () => showDetail(s);
                gridCards.appendChild(card);
            });
        }
    });
}

function getKategoriBadges(siswa, filter) {
    const riwayat = siswa.riwayat || {};
    const kejadian = Object.values(riwayat).filter(r => filter === "Semua" || r.hari === filter);
    const kategoriSet = new Set();
    kejadian.forEach(k => k.kategori.forEach(cat => kategoriSet.add(cat)));
    return Array.from(kategoriSet).map(cat => 
        `<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">${cat}</span>`
    ).join('');
}

// 4. Show Detail Modal
function showDetail(s) {
    detailNama.textContent = `${s.nama_lengkap} (${s.kelompok})`;
    detailTimeline.innerHTML = '';
    const riwayat = s.riwayat || {};
    let riwayatArray = Object.entries(riwayat).map(([id, data]) => ({ id, ...data }));

    if (currentFilter !== "Semua") {
        riwayatArray = riwayatArray.filter(r => r.hari === currentFilter);
    }

    // Sort by waktu_input descending (terbaru di atas)
    riwayatArray.sort((a, b) => new Date(b.waktu_input) - new Date(a.waktu_input));

    if (riwayatArray.length === 0) {
        detailTimeline.innerHTML = '<p class="text-gray-500 text-center">Tidak ada riwayat.</p>';
    } else {
        riwayatArray.forEach(r => {
            const item = document.createElement('div');
            item.className = 'bg-gray-900 p-4 rounded-lg border-l-4 border-red-500';
            const tgl = new Date(r.waktu_input).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            item.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-blue-400">${r.hari}</span>
                    <span class="text-xs text-gray-500">${tgl}</span>
                </div>
                <div class="flex flex-wrap gap-2 mb-2">
                    ${r.kategori.map(cat => `<span class="bg-red-900 text-red-200 text-xs px-2 py-1 rounded">${cat}</span>`).join('')}
                </div>
                <p class="text-sm text-gray-300 italic mb-2">"${r.komentar || 'Tidak ada komentar'}"</p>
                <p class="text-xs text-gray-500">Dicatat oleh: ${r.fasilitator}</p>
            `;
            detailTimeline.appendChild(item);
        });
    }
    modalDetail.classList.add('active');
}

// 5. Export Excel
function exportExcel() {
    if (allData.length === 0) return alert('Tidak ada data untuk diekspor.');

    const headers = [
        "No Absen",
        "Nama Lengkap",
        "Kelompok",
        "Total Pelanggaran",
        "Pelanggaran Hari 1",
        "Pelanggaran Hari 2",
        "Pelanggaran Hari 3"
    ];

    const rows = allData.map(siswa => {
        const riwayat = Object.values(siswa.riwayat || {});

        return [
            { value: siswa.nomor_absen, style: 'text-align:center;mso-number-format:"\\@";' },
            { value: siswa.nama_lengkap },
            { value: siswa.kelompok, style: 'text-align:center;' },
            { value: riwayat.length, style: 'text-align:center;font-weight:bold;' },
            { value: formatRiwayatHari(riwayat, "Hari 1") },
            { value: formatRiwayatHari(riwayat, "Hari 2") },
            { value: formatRiwayatHari(riwayat, "Hari 3") }
        ];
    });

    const tableRows = rows.map(row => `
        <tr>
            ${row.map(cell => renderExcelCell(cell.value, cell.style)).join('')}
        </tr>
    `).join('');

    const exportedAt = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const dateSlug = new Date().toISOString().split('T')[0];

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #111827; }
        h1 { margin: 0 0 4px; font-size: 18px; color: #1d4ed8; }
        p { margin: 0 0 16px; font-size: 12px; color: #4b5563; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #1d4ed8; color: #ffffff; font-weight: bold; border: 1px solid #93c5fd; padding: 10px 8px; text-align: left; }
        td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
    </style>
</head>
<body>
    <h1>Rekap Pelanggaran INSEKTA 11</h1>
    <p>Diekspor pada: ${escapeHtml(exportedAt)}</p>
    <table>
        <thead>
            <tr>
                ${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
</body>
</html>`;

    const blob = new Blob(["\uFEFF", html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Pelanggaran_INSEKTA11_${dateSlug}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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
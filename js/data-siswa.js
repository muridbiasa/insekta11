// ============================================================
// js/data-siswa.js
// Data 127 siswa yang dibagi ke 11 kelompok (A - K)
// ============================================================

const namaAsli = [
  "Cindy Aurelia Renata Kurniawan",
  "Nathanael Axel Sutanto",
  "Evangeline Gwen Hebertson",
  "Laura Quinsha Sachi Rosari",
  "Kezia Raissa Santoso",
  "Fiorentina Agustine Wijaya",
  "Ofira Maisie Setiawan",
  "Michelle Bellina Anggrianto",
  "Valencia Michelle Aurellia Christie",
  "Jocelyne Callista Wibowo",
  "Alexandra Shalom Putri Daniel",
  "Yosua Pandu Wijaya Putra",
  "Josephine Clareva Audrina",
  "Samantha Adelia Pramono",
  "Angelisa Sankeanno Keyrha",
  "Klaudia Vanessa Sagitania Putri",
  "Franzeska Joceline Nugraha",
  "Nesha Thianata",
  "Jeniffer Keira Tanujaya",
  "Maulin Tan",
  "Agatha Intan Miyor Wirong",
  "Gwen Alicia Utomo",
  "Clarissa Florensya Orie",
  "Leonardus Marvel Suharyanto",
  "Angelin Iona Claressa",
  "Gabrielle Leona Wiryawan",
  "Vincentia Almeta Arum Ayunda",
  "Regina Ellice Saputra",
  "Giannica Fang Lustin",
  "Giesel Nazdaniea",
];

// Generate 127 nama (30 asli + 97 dummy)
const semuaNama = [...namaAsli];
for (let i = semuaNama.length + 1; semuaNama.length < 127; i++) {
  semuaNama.push(`Siswa Dummy ${i}`);
}

// Konfigurasi kelompok A - K (11 kelompok)
const kelompokKeys = ["A","B","C","D","E","F","G","H","I","J","K"];

// Distribusi: 127 siswa / 11 kelompok
// 6 kelompok pertama dapat 12 siswa, 5 kelompok terakhir dapat 11 siswa
// Total: 6*12 + 5*11 = 72 + 55 = 127 ✓
const distribusi = [12,12,12,12,12,12,11,11,11,11,11];

// Bangun object dataSiswa
// Format: { "KELOMPOK A": [{ nomor_absen, nama_lengkap, kelompok, doc_id }, ...], ... }
const dataSiswa = {};

let siswaIndex = 0;
kelompokKeys.forEach((huruf, ki) => {
  const namaKelompok = `KELOMPOK ${huruf}`;
  const jumlah = distribusi[ki];
  dataSiswa[namaKelompok] = [];

  for (let i = 0; i < jumlah; i++) {
    const nomorAbsen = String(i + 1).padStart(2, "0");
    dataSiswa[namaKelompok].push({
      nomor_absen: nomorAbsen,
      nama_lengkap: semuaNama[siswaIndex],
      kelompok: namaKelompok,
      doc_id: `KLP_${huruf}_${nomorAbsen}`,
    });
    siswaIndex++;
  }
});

// Helper: ambil daftar nama kelompok
const daftarKelompok = kelompokKeys.map((h) => `KELOMPOK ${h}`);

export { dataSiswa, daftarKelompok };

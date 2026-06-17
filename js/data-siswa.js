// js/data-siswa.js

// 120+ Nama Asli dari Excel FORMULIR PENDAFTARAN PANITIA SHC 2026
const namaSiswaAsli = [
    "Cindy Aurelia Renata Kurniawan", "Nathanael Axel Sutanto", "Evangeline Gwen Hebertson", 
    "Laura Quinsha Sachi Rosari", "Kezia Raissa Santoso", "Fiorentina Agustine Wijaya", 
    "Ofira Maisie Setiawan", "Michelle Bellina Anggrianto", "Valencia Michelle Aurellia Christie", 
    "Jocelyne Callista Wibowo", "Alexandra Shalom Putri Daniel", "Yosua Pandu Wijaya Putra", 
    "Josephine Clareva Audrina", "Samantha Adelia Pramono", "Angelisa Sankeanno Keyrha", 
    "Klaudia Vanessa Sagitania Putri", "Franzeska Joceline Nugraha", "Nesha Thianata", 
    "Jeniffer Keira Tanujaya", "Maulin Tan", "Agatha Intan Miyor Wirong", "Gwen Alicia Utomo", 
    "Clarissa Florensya Orie", "Leonardus Marvel Suharyanto", "Angelin Iona Claressa", 
    "Gabrielle Leona Wiryawan", "Vincentia Almeta Arum Ayunda", "Regina Ellice Saputra", 
    "Giannica Fang Lustin", "Giesel Nazdaniea", "Ron Alayna Eugene", "Athalia Kelly Alexander",
    "Shamara Pangestu Bumi Grasia", "Aveline Angelita Wibowo", "Felicia Sefalina Santoso",
    "Grace Qeren Happukh Excell", "Patricia Dewi Majesdwika", "Priscilla roselyn",
    "Jessica Joyceline Budiono", "Edward Daniswara", "Misshya Aulia Wijaya",
    "Elisabeth Keiza Pransisnanto", "Laura Cantika Betharina", "BERNARD MAXIMILLIANO CHARLES SETIANTO",
    "Eugenia nidya surya", "Patricia Yuannita Wibowo", "Amanda Carmelita Cahyono",
    "Maureen Nichele Lin", "Gabriella Irene Putri Pramono", "Christian Valentino Wijaya",
    "Gloryeve Alexandra Samson", "Emerentia Pradipta", "Theophila Brigita Xaviana Sutanto",
    "Vania Alodia", "Felicia Christine Purnawan", "Nathania Connie Marietta",
    "Maria Evani Clarabelle Sefira", "Vinny amelia tamariska", "Maria Faustina Nathania",
    "Benedicta Yoshe Rhianditya", "Calysta Vidya Davina Putri", "Jennifer Grace Prasetya",
    "Gabriella Rosely", "Efrasia fenita muljono", "Vania Supranoto",
    "Felicia Quinn Hadhitama", "Febby Angelina Iskandar", "Aurellia wibowo",
    "Maria Natalia Christy Wicaksono", "Elisabeth Monic Josalyn", "Livya Joycelline Angelique Susanto",
    "Veronica Ines", "Frederica Charissa Ferdinda", "Flaviana Quenisha Paramesti",
    "Jessica Anne Setyono", "Paska Immanuela Sembiring", "Vinsensius Stevino Paschaliano",
    "Evelyne Mirra Audriana", "Cinthia Victoria Santosa", "Alexandra Shalom Putri Daniel",
    "Salsabila Aprilia Nuraini", "Audra Ocwisya Rambu Haja", "Caroline",
    "Felicia Christin Herianto", "CHRISTIAN NUGROHO ADI S", "Angelique Chriestantia H",
    "Vivian Julia Chandra", "Rafael Lakeswara Prasatmaja", "Alycia Archangela Widjojo",
    "Cecilia Livina Santoso", "Lionel Meisilano Hermawan", "Carrisa Nathania Joice Setiawan",
    "Keyla Florenzia", "Michelle Caithlin Joe", "Rinoa Heartly P",
    "Clara Jacqlien Chstdiana", "Larasati Widya Tanmihardja", "Helsa Ashera",
    "Crescentia Nathanielle Magnolia Budi", "Aurelia Elena Halim", "Felice Tannia",
    "Benedicta Jeannette. C", "Chatarina Elvina Alodia", "Aurelia Gladys Darmawan",
    "Valerie Lorenz Wibisono", "Eleonora Alfreda Freya Larissa", "Gabriel Calista Anthea",
    "Monika Shaula.", "Steven Excel Lorenzo", "Michael Evan Valerio Hanesta",
    "Regina Nadine Clarissa Dewi", "Livia Agnes Nainggolan", "Vannesa Caroline Supriyadi",
    "Teresa Lavenia Wibowo", "Felicya Kurniawan", "Michael Harris Septianto",
    "Benedicta Jeannette. C", "Alexa Rafella. Hambalie", "Joseph Ernest Prasetio",
    "Gwendolyn Ananda The"
];

// Genapkan jadi 127 siswa
const semuaNama = [...namaSiswaAsli];
while (semuaNama.length < 127) {
    semuaNama.push(`Siswa Dummy ${semuaNama.length + 1}`);
}

// Konfigurasi 11 Kelompok (A - K)
const kelompokList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

// Distribusi: 6 kelompok pertama dapat 12 siswa, 5 kelompok terakhir dapat 11 siswa
// Total: (6 × 12) + (5 × 11) = 72 + 55 = 127 siswa
const distribusi = [12, 12, 12, 12, 12, 12, 11, 11, 11, 11, 11];

// Bangun FLAT ARRAY OF OBJECTS
export const daftarSiswa = [];
let siswaIndex = 0;

kelompokList.forEach((huruf, ki) => {
    const namaKelompok = `KELOMPOK ${huruf}`;
    const jumlah = distribusi[ki];
    
    for (let i = 1; i <= jumlah; i++) {
        const nomorAbsen = String(i).padStart(2, '0');
        
        daftarSiswa.push({
            id: `KLP_${huruf}_${nomorAbsen}`,
            nomor_absen: nomorAbsen,
            nama_lengkap: semuaNama[siswaIndex],
            kelompok: namaKelompok
        });
        
        siswaIndex++;
    }
});

// Helper: ambil daftar nama kelompok (unique)
export const daftarKelompok = [...new Set(daftarSiswa.map(s => s.kelompok))].sort();
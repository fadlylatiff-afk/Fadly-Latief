# 📖 Panduan Integrasi Google Apps Script & Google Sheets
## Wedding Guest Management Dashboard

Panduan ini menjelaskan secara mendetail cara memindahkan dan menggunakan aplikasi **Wedding Guest Management** ini dengan **Google Apps Script (GAS)** dan **Google Sheets** sebagai database cloud permanen.

Aplikasi ini dirancang dengan arsitektur **Dual-Sync** yang sangat fleksibel, mendukung dua cara integrasi yang luar biasa sesuai kebutuhan Anda.

---

## 📌 Daftar Isi
1. [Bagaimana Cara Kerja Integrasi Ini?](#-bagaimana-cara-kerja-integrasi-ini)
2. [Langkah 1: Persiapan Google Sheets](#-langkah-1-persiapan-google-sheets)
3. [Langkah 2: Menyiapkan Google Apps Script Backend (`Code.gs`)](#-langkah-2-menyiapkan-google-apps-script-backend-codegs)
4. [Langkah 3: Deploy Backend Sebagai "Web App"](#-langkah-3-deploy-backend-sebagai-web-app)
5. [Langkah 4: Menghubungkan Frontend React](#-langkah-4-menghubungkan-frontend-react)
   - [Opsi A: Integrasi Live Sync REST-CORS (Rekomendasi ⭐)](#opsi-a-integrasi-live-sync-rest-cors-rekomendasi-)
   - [Opsi B: Integrasi Tertanam (Embedded Single-File HTML)](#opsi-b-integrasi-tertanam-embedded-single-file-html)
6. [Fitur Manajemen Foto Unggah otomatis ke Google Drive](#-fitur-manajemen-foto-unggah-otomatis-ke-google-drive)

---

## 🔄 Bagaimana Cara Kerja Integrasi Ini?

Aplikasi ini menggunakan **Google Apps Script** untuk bertindak sebagai penghubung data gratis yang andal. Terdapat dua mode yang dapat Anda pakai:

### 🌟 Opsi A: Mode Sinkronisasi API Live (REST-CORS) - *Sangat Direkomendasikan!*
Anda meng-host antarmuka (frontend) React ini di mana saja (misalnya GitHub Pages, Vercel, Netlify, atau dijalankan lokal). 
- Frontend melakukan permintaan `fetch()` (`doGet` dan `doPost`) langsung ke URL Web App Apps Script Anda.
- **Kelebihan:** Sangat mudah diperbarui, mendukung fungsionalitas browser penuh (kamera, local storage tanpa dibatasi iframe), dan responsif luar biasa tanpa latensi berlebih.

### 📦 Opsi B: Mode Tertanam (Embedded)
Anda membundel seluruh aplikasi React ini ke dalam satu file HTML tunggal (`dist/Index.html`) dan mengunggahnya langsung ke dalam Google Apps Script.
- Aplikasi dievaluasi dan dijalankan langsung di bawah domain `script.google.com` dengan metode RPC `google.script.run`.
- **Kelebihan:** Sepenuhnya gratis di-host oleh raksasa Google, database langsung tersambung otomatis, dan aman dalam ekosistem internal Google Drive Anda.

---

## 📊 Langkah 1: Persiapan Google Sheets

Sebelum memasukkan kode skrip, Anda harus menyiapkan dokumen spreadsheet:

1. Buat spreadsheet baru di Google Drive Anda (misal beri nama: `Database Buku Tamu Undangan`).
2. Buat sheet baru di dalamnya dan berikan nama tab sheet tepat: **`Daftar_Tamu`** (jika berbeda, Anda dapat mengubah konstanta `SHEET_NAME` di file GAS).
3. Anda **tidak perlu memasukkan header secara manual** karena script backend di bawah ini akan mendeteksi lembar kosong pertama kali dan otomatis menyusun kolom serta mewarnai header dokumen Anda dengan indah! Namun jika ingin dibuat manual, urutan header kolom (Baris 1 dari Kolom A-H) adalah:
   - **Kolom A:** `id` (ID Undangan)
   - **Kolom B:** `name` (Nama Tamu)
   - **Kolom C:** `category` (Kategori)
   - **Kolom D:** `status` (Belum Hadir / Hadir)
   - **Kolom E:** `guestCount` (Jumlah Pendamping)
   - **Kolom F:** `checkInTime` (Waktu Rekam Masuk)
   - **Kolom G:** `photoUrl` (Tautan Bukti Foto Google Drive)
   - **Kolom H:** `notes` (Catatan Tambahan)

---

## 💻 Langkah 2: Menyiapkan Google Apps Script Backend (`Code.gs`)

Kami telah menyediakan file server lengkap di project ini dengan nama **`Code.gs`**. Berikut adalah langkah untuk menyalinnya ke spreadsheet Anda:

1. Di dalam spreadsheet yang baru Anda buat, klik menu utama bagian atas: **Extensions** > **Apps Script**.
2. Editor skrip Google Apps Script akan terbuka di tab baru browser Anda.
3. Hapus semua fungsi default (seperti `myFunction()`) di dalam file bawaan `Code.gs`.
4. Buka file **`Code.gs`** dari proyek ini, salin seluruh kodenya, dan tempelkan (paste) ke editor Google Apps Script Anda.
5. Klik ikon **Save** 💾 (atau tekan `Ctrl + S`/`Cmd + S`) untuk menyimpan berkas skrip.

---

## 🚀 Langkah 3: Deploy Backend Sebagai "Web App"

Agar frontend aplikasi dapat mengobrol dengan Google Sheets, backend ini harus diekspos sebagai API Web publik yang aman:

1. Di pojok kanan atas layar editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Pada panel yang muncul, klik ikon gerigi ⚙️ di samping *Select type* dan pilih **Web app**.
3. Konfigurasikan pengaturan persis seperti berikut:
   - **Description:** `Wedding Guest Book Live Engine 1.0`
   - **Execute as:** Pilih **Me (emailanda@gmail.com)**. *(Ini memberi hak akses bagi aplikasi untuk menulis ke Sheets Anda)*.
   - **Who has access:** Pilih **Anyone** (Siapa saja bahkan anonim). *(Ini sangat penting agar frontend eksternal dapat melakukan sinkronisasi data tanpa terhalang sistem autentikasi rumit)*.
4. Klik tombol **Deploy** di bagian bawah.
5. Jika ini peluncuran pertama Anda, Google akan meminta konformasi keamanan (**Authorize Access**). Klik tombol tersebut, pilih akun Google Anda, klik tautan kecil **Advanced** di kiri bawah, pilih **Go to Database Buku Tamu Undangan (unsafe)**, lalu klik **Allow**.
6. Google akan memproses deployment Anda dan menunjukkan **Web App URL** yang tampak seperti:
   `https://script.google.com/macros/s/AKfycbyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec`
7. **Salin URL Web App ini!** Kita akan menggunakannya untuk menghubungkan frontend.

---

## 🎨 Langkah 4: Menghubungkan Frontend React

Pilihlah salah satu dari dua opsi berikut untuk menjalankan aplikasinya:

### Opsi A: Integrasi Live Sync REST-CORS (Rekomendasi ⭐)

Gunakan metode ini jika Anda ingin mengoperasikan web app ini dari luar Google Apps Script:

1. Buka aplikasi visual ini (misal di development server lokal atau website yang Anda publikasikan).
2. Klik tab menu **Integrasi Sheets** (ikon Roda Gigi di sidebar).
3. Ubah preferensi mode penyimpanan dari *Offline-First* menjadi **Live Mode (Mode Sinkronisasi Langsung)**.
4. Pada kolom **Google Apps Script Web App URL**, tempelkan URL Web App yang Anda salin pada [Langkah 3](#-langkah-3-deploy-backend-sebagai-web-app).
5. Klik **Simpan Pengaturan**.
6. 🎉 **Selesai!** Aplikasi Anda sekarang sepenuhnya sinkron langsung dengan dokumen Google Sheets Anda. Ketika Anda mencari nama tamu, check-in dengan kamera, mendaftarkan tamu walk-in baru, atau menghapus entri, semuanya akan ter-update seketika di Google Sheets Anda.

---

### Opsi B: Integrasi Tertanam (Embedded Single-File HTML)

Gunakan metode ini jika Anda menginginkan hosting gratis selamanya langsung di dalam server Google Apps Script Anda!

Karena editor Google Apps Script tidak mengizinkan referensi sheet file eksternal secara terpisah, kita harus membundel modul React (JS dan CSS) ke dalam berkas `Index.html` tunggal:

1. Buka terminal Anda di direktori proyek ini.
2. Jalankan perintah kompilasi produksi di terminal:
   ```bash
   npm run build
   ```
3. Setelah build selesai, jalankan perintah bundling otomatis yang telah kami program khusus untuk Anda:
   ```bash
   npm run bundle
   ```
4. Perintah ini akan membaca file `dist/index.html` dan otomatis menyatukan semua logika JavaScript dan gaya visual Tailwind ke dalam sebuah file solid: **`dist/Index.html`** (Perhatikan huruf 'I' kapital).
5. Buka editor Google Apps Script Anda lagi yang berisi `Code.gs`.
6. Di menu bar kiri editor Apps Script, klik tombol tambah file **(+)** > pilih **HTML**.
7. Berikan nama file tepat: **`Index`** (Skrip akan mengenali file ini sebagai halaman utama).
8. Buka dan buka berkas `/dist/Index.html` dari komputer Anda, salin seluruh isi kodenya, lalu tempelkan semua kode ke dalam berkas `Index.html` baru di Google Apps Script tersebut.
9. Simpan proyek tersebut.
10. Lakukan **New Deployment** ulang (atau **Manage deployments** > edit versi ke *New version*) agar perubahan termuat.
11. Klik tautan URL Web App yang diberikan Google, lalu buka di browser Anda atau sematkan di tablet petugas gerbang masuk Anda!
12. 📸 **Kamera & Kehadiran:** Sistem akan secara otomatis berjalan dalam mode server-internal `google.script.run` yang aman, cepat, dan 100% cloud-hosted!

---

## 📁 Fitur Manajemen Foto Unggah otomatis ke Google Drive

Salah satu fitur premium mahakarya dalam backend `Code.gs` ini adalah **Auto-Folder Drive Media Synchronization**:

- Ketika petugas melakukan pengambilan snapshot wajah tamu di counter check-in, aplikasi akan mengubah data piksel kanvas webcam ke format aman **Base64**.
- Kode di `Code.gs` menerima base64 tersebut melalui API, mengubahnya kembali ke bentuk biner gambar (`Utilities.newBlob()`), dan menyimpannya ke dalam folder khusus Google Drive bernama **`Foto_CheckIn_Wedding`**.
- Jika folder tersebut belum ada di Google Drive Anda, skrip akan **secara dinamis membuatnya secara otomatis**!
- Skrip seterus-nya mengatur visibilitas foto tersebut menjadi 'Public Viewable' (`ANYONE_WITH_LINK`) dan mengembalikan tautan unduhan absolutnya ke spreadsheet.
- Hal ini menjaga spreadsheet Anda tetap ramping, terorganisir, dan memiliki data bukti otentik rekam masuk perhelatan yang akurat!

---

*Selamat menyelenggarakan hari bahagia yang mengesankan dengan pendaftaran tamu yang seamless & modern! • Dipersembahkan oleh Dream08*

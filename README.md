

Website file-download manager bergaya MediaFire, dibuat hanya dengan HTML + CSS + JavaScript.

## Struktur
- `login.html` — login Google / demo login
- `dashboard.html` — dashboard utama + welcome
- `download.html` — library download
- `admin.html` — upload/edit/hapus file, hanya email admin
- `style.css` — UI Ice Blue + Night Blue, dark/light mode
- `app.js` — auth session, IndexedDB file storage, dashboard, download, admin

## Menjalankan
Bisa dibuka langsung di browser, tetapi Google Identity Services membutuhkan origin/domain yang terdaftar. Untuk pengujian lokal, gunakan tombol demo login.

## Login Gmail
1. Buat OAuth Web Client ID di Google Cloud Console.
2. Masukkan Client ID ke `GOOGLE_CLIENT_ID` di `app.js`.
3. Tambahkan domain/localhost yang digunakan ke Authorized JavaScript origins.
4. Ubah `ADMIN_EMAILS` menjadi email admin Anda.

## Catatan arsitektur
Karena proyek ini dibatasi HTML/CSS/JS tanpa backend, autentikasi role admin dan file storage berada di sisi browser. Ini cocok untuk prototype/static deployment, bukan penyimpanan publik multi-user yang aman seperti MediaFire production. Untuk production sungguhan diperlukan backend, database, object storage, dan server-side session/token verification.

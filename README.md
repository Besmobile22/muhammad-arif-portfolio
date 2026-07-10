# MAA Portfolio Website

Portfolio pribadi Muhammad Arif Alawi untuk kebutuhan internship/magang. Website ini dibuat sebagai static site menggunakan HTML, CSS, dan vanilla JavaScript.

## Fitur

- Responsive portfolio website dengan dark theme dan aksen orange.
- Dynamic portfolio data dari `portfolioData.json` dengan fallback ke `data.js`.
- Admin panel di `admin.html` untuk edit profile, projects, tools, dan social links.
- Draft data admin menggunakan `localStorage` dengan key `portfolioData`.
- Login ringan admin menggunakan `sessionStorage`.
- Project image carousel dengan multi-image support.
- Download CV dari `assets/CV/cv-muhammad-arif-alawi.pdf`.
- Contact form menggunakan EmailJS.

## Struktur File

```text
index.html
style.css
script.js
data.js
portfolioData.json
admin.html
admin.css
admin.js
assets/
  CV/
  icons/
  images/
  potofolio/
  reference/
  social/
```

## Menjalankan Lokal

Buka `index.html` langsung di browser untuk melihat portfolio utama.

Buka `admin.html` untuk mengelola data portfolio. Password admin lokal:

```text
admin123
```

Catatan: login admin ini hanya proteksi ringan untuk static/local site, bukan keamanan production.

## Mengatur Data Portfolio

Data global untuk website online berada di `portfolioData.json`. Halaman utama mengambil file ini dengan cache-busting supaya mobile dan desktop membaca data terbaru setelah deploy.

Data default cadangan berada di `data.js`. Jika admin panel dipakai dan tombol `Save Changes` diklik, data akan disimpan sebagai draft di browser melalui `localStorage`.

Project mendukung banyak gambar melalui field:

```js
images: [
  "assets/potofolio/project-1.png",
  "assets/potofolio/project-2.png"
]
```

Data lama dengan field `image` tetap didukung.

## Publish Update dari Admin

Karena website berjalan di static hosting Cloudflare Pages, admin panel tidak bisa menulis langsung ke server tanpa backend. Untuk membuat update tampil di semua device:

1. Buka `admin.html` dan login.
2. Edit profile, tools, socials, atau projects.
3. Klik `Save Changes` untuk menyimpan draft di browser.
4. Klik `Export JSON`.
5. Ganti file `portfolioData.json` di root project dengan file hasil export.
6. Commit dan push ke branch `main`.
7. Cloudflare Pages akan redeploy, lalu semua device membaca data terbaru.

## Deploy

Website ini bisa dideploy sebagai static site tanpa build command.

Cloudflare Pages:

- Framework preset: None / Static HTML
- Build command: kosongkan
- Build output directory: `/` atau root project

GitHub Pages:

- Source: deploy from branch
- Branch: `main`
- Folder: `/ (root)`

## Catatan Production

- Pastikan file gambar sudah berada di folder `assets` sebelum path dimasukkan lewat admin.
- Data admin di `localStorage` bersifat per-browser. Untuk data permanen di hosting static, publish `portfolioData.json` melalui commit/deploy.
- Jangan simpan password, token, API key rahasia, atau data sensitif di frontend.

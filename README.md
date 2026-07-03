# MAA Portfolio Website

Portfolio pribadi Muhammad Arif Alawi untuk kebutuhan internship/magang. Website ini dibuat sebagai static site menggunakan HTML, CSS, dan vanilla JavaScript.

## Fitur

- Responsive portfolio website dengan dark theme dan aksen orange.
- Dynamic portfolio data dari `data.js`.
- Admin panel di `admin.html` untuk edit profile, projects, tools, dan social links.
- Penyimpanan data admin menggunakan `localStorage` dengan key `portfolioData`.
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

Data default berada di `data.js`. Jika admin panel dipakai dan tombol `Save Changes` diklik, data akan disimpan di browser melalui `localStorage`.

Project mendukung banyak gambar melalui field:

```js
images: [
  "assets/potofolio/project-1.png",
  "assets/potofolio/project-2.png"
]
```

Data lama dengan field `image` tetap didukung.

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
- Data admin di `localStorage` bersifat per-browser. Untuk data permanen di hosting static, update `data.js` atau import/export JSON sesuai kebutuhan.
- Jangan simpan password, token, API key rahasia, atau data sensitif di frontend.

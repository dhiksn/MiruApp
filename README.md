# MiruApp API

Proyek ini adalah backend Node.js/Express untuk aplikasi MiruApp. API ini bertindak sebagai wrapper untuk data anime Samehadaku dan juga menyajikan UI statis dari folder `public/`.

## Ringkasan

- Backend: Node.js + Express
- Static web UI: `public/`
- API proxy: mengambil data dari sumber anime eksternal dan menyajikannya dalam format JSON yang konsisten

## Fitur

- API anime lengkap (home, recent, search, ongoing, completed, popular, movies, list, schedule, genres, batch, detail)
- Logging request sederhana
- Error handling API

## Persyaratan

- Node.js 18+ atau versi yang kompatibel
- npm

## Instalasi

1. Clone repositori
2. Masuk ke direktori proyek:

```bash
cd c:\path\path\miruapp
```

3. Instal dependensi:

```bash
npm install
```

4. Buat file `.env` di root proyek:

```env
PORT=3000
BASE_URL=https://www.sankavollerei.com
REQUEST_TIMEOUT=10000
```

5. Jalankan server:

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000` secara default.

## Konfigurasi Environment

- `PORT`: port untuk menjalankan server
- `BASE_URL`: base URL sumber data anime eksternal
- `REQUEST_TIMEOUT`: timeout untuk panggilan HTTP

## API Utama

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/home` | Data halaman utama |
| GET | `/api/recent?page=` | Episode terbaru |
| GET | `/api/search?q=&page=` | Cari anime berdasarkan judul |
| GET | `/api/ongoing?page=` | Daftar anime ongoing |
| GET | `/api/completed?page=&order=` | Daftar anime completed |
| GET | `/api/popular?page=` | Daftar anime populer |
| GET | `/api/movies?page=` | Daftar anime movie |
| GET | `/api/list` | Daftar lengkap anime |
| GET | `/api/schedule` | Jadwal tayang anime |
| GET | `/api/genres` | Semua genre |
| GET | `/api/genre/:genre?page=` | Anime berdasarkan genre |
| GET | `/api/batch?page=` | Daftar batch download |
| GET | `/api/anime/:slug` | Detail anime |
| GET | `/api/episode/:slug` | Detail episode |
| GET | `/api/batch/:slug` | Detail batch |
| GET | `/api/server/:id` | Data server streaming |

## Format Response

Semua response API mengikuti struktur berikut:

```json
{
  "status": true,
  "message": "Success",
  "data": { ... }
}
```

Untuk error:

```json
{
  "status": false,
  "message": "Error description",
  "data": null
}
```

## Struktur Proyek

```
├── app.js
├── package.json
├── public/                      # UI web statis
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
└── flutter/
```



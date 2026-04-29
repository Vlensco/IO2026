# 🎭 Simulacra — AI-Powered Soft Skill Simulator

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_AI-orange?style=for-the-badge&logo=ollama)](https://ollama.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-blue?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**Simulacra** adalah platform simulasi berbasis AI yang dirancang untuk membantu pengguna melatih kemampuan komunikasi dan *soft skills* mereka melalui skenario interaktif yang realistis. Menggunakan model AI lokal untuk privasi data maksimal dan biaya operasional nol.

---

## 🚀 Fitur Utama
- **Real-time AI Roleplay**: Berinteraksi dengan AI yang memiliki kepribadian unik.
- **Local AI Processing**: Menggunakan Ollama (Llama 3) untuk pemrosesan bahasa alami secara lokal.
- **Natural TTS (Text-to-Speech)**: Suara karakter yang natural menggunakan EdgeTTS.
- **Dynamic Evaluation**: Penilaian otomatis terhadap performa komunikasi pengguna di akhir sesi.
- **Data Privacy**: Semua data percakapan diproses secara lokal atau dalam instance database privat.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **AI Engine**: Ollama (Running Llama 3:8b).
- **Audio Engine**: EdgeTTS (Python-based Local Server).
- **Backend/Database**: Supabase (PostgreSQL, Auth).

---

## 📦 Panduan Instalasi (Lokal)

Untuk menjalankan proyek ini di perangkat Anda, ikuti langkah-langkah berikut:

### 1. Prasyarat
- **Node.js** (v18+)
- **Python** (v3.10+) — Untuk server TTS.
- **Ollama** — [Download di sini](https://ollama.com/).

### 2. Setup Ollama (Local AI)
Simulacra menggunakan model **Llama 3**. Pastikan Ollama berjalan dan model sudah di-download:
```bash
ollama pull llama3:8b
```

### 3. Setup EdgeTTS (Suara Karakter)
Buka folder `edge-tts-server` dan jalankan servernya:
```bash
cd edge-tts-server
# Install dependencies (sekali saja)
pip install -r requirements.txt
# Jalankan server
start.bat
```
*Pastikan server TTS berjalan di port 5050.*

### 4. Setup Database (Supabase)
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com/).
2. Jalankan query SQL dari file `simulacra_schema.sql` di SQL Editor Supabase untuk membuat tabel utama.
3. Jalankan query dari file `supabase-migration.sql` untuk update kolom terbaru.

### 5. Konfigurasi Environment
Salin file `.env.example` menjadi `.env.local` dan isi kredensial Supabase Anda:
```bash
cp .env.example .env.local
```

### 6. Jalankan Aplikasi
```bash
npm install
npm run dev
```
Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

---

## ⚠️ Mengapa Menggunakan Model Lokal? (Catatan untuk Juri)

Kami sengaja memilih **Local LLM (Ollama)** daripada API berbayar (seperti OpenAI/Gemini) karena:
1. **Privasi & Keamanan**: Data sensitif pengguna (percakapan simulasi) tidak pernah keluar dari server/perangkat lokal.
2. **Efisiensi Biaya**: Tidak ada biaya API per-token, memungkinkan penggunaan tanpa batas untuk edukasi.
3. **Kemandirian**: Aplikasi tetap dapat berjalan tanpa koneksi internet (jika server TTS & DB di-hosting secara lokal).

---

## 📽️ Demo Video
Jika Anda mengalami kendala dalam setup lokal (karena keterbatasan hardware untuk menjalankan LLM), Anda dapat melihat demo fungsionalitas penuh kami di:
👉 **[LINK VIDEO DEMO YOUTUBE DI SINI]**

---

## 📄 Lisensi
Proyek ini dibuat untuk keperluan kompetisi **IOFest** dan didistribusikan di bawah lisensi MIT.

---
Created with ❤️ by **Team Simulacra**

// server.js
// Backend untuk "QA/QC Document Assistant" — chatbot berbasis Gemini API
// yang menjawab pertanyaan customer/auditor eksternal terkait dokumen kualitas
// (Sertifikat Halal, BPOM, NKV, ISO, dll) dan membagikan file dokumennya.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.7-flash";

if (!GEMINI_API_KEY) {
  console.warn(
    "[WARNING] GEMINI_API_KEY belum diisi di file .env. Chatbot tidak akan bisa merespons."
  );
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Katalog dokumen (data internal QA/QC) — sumber pengetahuan chatbot
const documents = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "documents.json"), "utf-8")
);

// Riwayat percakapan sederhana per sesi (in-memory, cukup untuk demo/training)
const sessions = new Map();

function buildSystemInstruction() {
  const daftarDokumen = documents
    .map(
      (d) =>
        `- id: "${d.id}" | nama: ${d.nama} | kategori: ${d.kategori} | produk: ${d.produk} | penerbit: ${d.penerbit} | masa berlaku: ${d.masaBerlaku} | deskripsi: ${d.deskripsi}`
    )
    .join("\n");

  return `Kamu adalah "QA/QC Document Assistant", asisten resmi departemen QA/QC sebuah perusahaan.
Tugasmu menjawab pertanyaan dari CUSTOMER atau AUDITOR EKSTERNAL yang menanyakan status atau meminta
dokumen legalitas/kualitas produk seperti Sertifikat Halal, Izin Edar BPOM, NKV, dan ISO.

Gaya bahasa: formal, sopan, profesional, ringkas, gunakan Bahasa Indonesia.

Berikut adalah daftar dokumen yang tersedia dan boleh kamu informasikan/bagikan:
${daftarDokumen}

Aturan penting:
1. Jika pertanyaan cocok dengan salah satu atau beberapa dokumen di atas, jelaskan info singkatnya
   (nama, penerbit, masa berlaku) dan sertakan id dokumen tersebut pada field "documentIds".
2. Jika dokumen yang ditanyakan TIDAK ADA dalam daftar, katakan dengan jujur bahwa dokumen tersebut
   tidak tersedia melalui chatbot ini, dan arahkan untuk menghubungi tim QA/QC secara langsung.
   Jangan pernah mengarang nama dokumen atau nomor sertifikat yang tidak ada di daftar.
3. Jangan membahas topik di luar dokumen kualitas/legalitas produk perusahaan.
4. Selalu balas HANYA dalam format JSON sesuai skema yang diberikan.`;
}

async function askGemini(sessionId, userMessage) {
  const history = sessions.get(sessionId) || [];

  const contents = [
    ...history,
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const body = {
    system_instruction: {
      parts: [{ text: buildSystemInstruction() }],
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          answer: {
            type: "string",
            description: "Jawaban untuk user, dalam Bahasa Indonesia formal.",
          },
          documentIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Daftar id dokumen (dari katalog) yang relevan dan boleh dibagikan ke user. Kosongkan jika tidak ada.",
          },
        },
        required: ["answer", "documentIds"],
      },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(rawText);

  // Simpan riwayat percakapan (dibatasi 10 pertukaran terakhir agar ringan)
  history.push({ role: "user", parts: [{ text: userMessage }] });
  history.push({ role: "model", parts: [{ text: parsed.answer }] });
  sessions.set(sessionId, history.slice(-20));

  return parsed;
}

// Endpoint utama chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({ error: "message dan sessionId wajib diisi." });
    }

    const result = await askGemini(sessionId, message);

    // Lampirkan detail dokumen (bukan cuma id) supaya frontend bisa menampilkan tombol download
    const attachedDocs = (result.documentIds || [])
      .map((id) => documents.find((d) => d.id === id))
      .filter(Boolean)
      .map((d) => ({
        id: d.id,
        nama: d.nama,
        masaBerlaku: d.masaBerlaku,
        downloadUrl: `/api/documents/${d.id}`,
      }));

    res.json({ answer: result.answer, documents: attachedDocs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

// Endpoint untuk download file dokumen berdasarkan id
app.get("/api/documents/:id", (req, res) => {
  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Dokumen tidak ditemukan." });

  const filePath = path.join(__dirname, "documents", doc.file);
  if (!fs.existsSync(filePath)) {
    return res
      .status(404)
      .json({ error: "File belum diunggah di folder /documents pada server." });
  }
  res.download(filePath, doc.file);
});

// Endpoint bantu: list semua dokumen (opsional, untuk ditampilkan di UI)
app.get("/api/documents", (_req, res) => {
  res.json(documents.map(({ id, nama, kategori, masaBerlaku }) => ({ id, nama, kategori, masaBerlaku })));
});

app.listen(PORT, () => {
  console.log(`QA/QC Document Assistant berjalan di http://localhost:${PORT}`);
});

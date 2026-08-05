const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(dataDir, 'proofs.json');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDirectory(dataDir);
ensureDirectory(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

let proofs = [];

function loadProofs() {
  if (fs.existsSync(dataFile)) {
    try {
      proofs = JSON.parse(fs.readFileSync(dataFile, 'utf8')) || [];
    } catch (error) {
      console.error('Erro ao ler dados de provas:', error);
      proofs = [];
    }
  }
}

function saveProofs() {
  fs.writeFileSync(dataFile, JSON.stringify(proofs, null, 2), 'utf8');
}

loadProofs();

app.get('/api/proofs', (req, res) => {
  res.json(proofs);
});

app.post('/api/proofs', upload.single('mediaFile'), (req, res) => {
  const motive = (req.body.motive || '').trim();
  const description = (req.body.description || '').trim();
  const mediaLink = (req.body.mediaLink || '').trim();
  const hasFile = !!req.file;

  if (!motive || !description) {
    return res.status(400).json({ error: 'Motive e descrição são obrigatórios.' });
  }

  const proof = {
    id: Date.now(),
    motive,
    description,
    createdAt: new Date().toISOString(),
    mediaLink: mediaLink || null,
    mediaFileUrl: hasFile ? `/uploads/${req.file.filename}` : null,
    mediaFileName: hasFile ? req.file.originalname : null
  };

  proofs.unshift(proof);
  saveProofs();

  res.json(proof);
});

app.delete('/api/proofs/:id', (req, res) => {
  const id = Number(req.params.id);
  const proof = proofs.find((item) => item.id === id);
  if (!proof) {
    return res.status(404).json({ error: 'Registro não encontrado.' });
  }

  proofs = proofs.filter((item) => item.id !== id);
  saveProofs();

  if (proof.mediaFileUrl) {
    const filePath = path.join(uploadDir, path.basename(proof.mediaFileUrl));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.warn('Falha ao excluir arquivo de mídia:', error);
      }
    }
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

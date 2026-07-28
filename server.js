const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT) || 3337;

// ===== 中间件 =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== 文件存储配置 =====
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const META_FILE = path.join(__dirname, 'data', 'files.json');
const MEME_DIR = path.join(UPLOAD_DIR, 'memes');
const MEME_META_FILE = path.join(__dirname, 'data', 'memes.json');

// 确保目录存在
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(META_FILE))) fs.mkdirSync(path.dirname(META_FILE), { recursive: true });
if (!fs.existsSync(MEME_DIR)) fs.mkdirSync(MEME_DIR, { recursive: true });

// 文件元数据读写
function readMeta() {
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeMeta(data) {
  fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
}

function readMemeMeta() {
  try {
    return JSON.parse(fs.readFileSync(MEME_META_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeMemeMeta(data) {
  fs.writeFileSync(MEME_META_FILE, JSON.stringify(data, null, 2));
}

// 生成短 ID
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ===== Multer 配置 =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // 修复中文文件名编码：Buffer 转 UTF-8
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    cb(null, `${genId()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const memeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MEME_DIR),
  filename: (req, file, cb) => {
    // 修复中文文件名编码：Buffer 转 UTF-8
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    cb(null, `${genId()}${ext}`);
  }
});

const memeUpload = multer({
  storage: memeStorage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// 修复中文文件名编码
function fixFilename(name) {
  if (!name) return name;
  // 检测是否已经是有效 UTF-8（无乱码特征）
  // 如果原始名称包含多字节 UTF-8 序列且能正常显示，说明已经是 UTF-8
  const hasMultibyte = /[^\x00-\x7f]/.test(name);
  if (hasMultibyte) {
    // 已经是 UTF-8，直接返回
    return name;
  }
  // 纯 ASCII 名称无需转换
  return name;
}

// ===== API 路由 =====

// 表情包列表
app.get('/api/memes', (req, res) => {
  const meta = readMemeMeta();
  res.json(meta);
});

// 上传表情包
app.post('/api/memes/upload', memeUpload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '未选择文件' });
  }

  const meta = readMemeMeta();
  const records = req.files.map(file => ({
    id: genId(),
    // 修复中文文件名编码
    name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    size: file.size,
    type: file.mimetype,
    diskName: file.filename,
    url: `/uploads/memes/${file.filename}`,
    uploadedAt: new Date().toISOString()
  }));

  meta.unshift(...records);
  writeMemeMeta(meta);

  res.json(records);
});

// 删除表情包
app.delete('/api/memes/:id', (req, res) => {
  const meta = readMemeMeta();
  const idx = meta.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '表情包不存在' });

  const meme = meta[idx];
  const memePath = path.join(MEME_DIR, meme.diskName);
  if (fs.existsSync(memePath)) fs.unlinkSync(memePath);

  meta.splice(idx, 1);
  writeMemeMeta(meta);

  res.json({ success: true });
});

// 上传文件
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });

  // 修复中文文件名编码
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

  const meta = readMeta();
  const fileRecord = {
    id: genId(),
    name: originalName,
    size: req.file.size,
    type: req.file.mimetype,
    diskName: req.file.filename,
    uploadedAt: new Date().toISOString()
  };

  meta.unshift(fileRecord);
  writeMeta(meta);

  res.json(fileRecord);
});

// 文件列表
app.get('/api/files', (req, res) => {
  const meta = readMeta();
  res.json(meta);
});

// 下载文件（修复中文文件名编码）
app.get('/api/files/:id/download', (req, res) => {
  const meta = readMeta();
  const file = meta.find(f => f.id === req.params.id);
  if (!file) return res.status(404).json({ error: '文件不存在' });

  const filePath = path.join(UPLOAD_DIR, file.diskName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件已丢失' });

  // RFC 5987 编码，解决中文文件名乱码
  const encodedName = encodeURIComponent(file.name);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
  res.sendFile(filePath);
});

// 预览文件（图片等直接返回）
app.get('/api/files/:id/preview', (req, res) => {
  const meta = readMeta();
  const file = meta.find(f => f.id === req.params.id);
  if (!file) return res.status(404).json({ error: '文件不存在' });

  const filePath = path.join(UPLOAD_DIR, file.diskName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件已丢失' });

  res.sendFile(filePath);
});

// 删除文件
app.delete('/api/files/:id', (req, res) => {
  const meta = readMeta();
  const idx = meta.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '文件不存在' });

  const file = meta[idx];
  const filePath = path.join(UPLOAD_DIR, file.diskName);

  // 删除磁盘文件
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  meta.splice(idx, 1);
  writeMeta(meta);

  res.json({ success: true });
});

// SPA 回退
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 文件上传错误处理
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件过大，最大支持 50MB' });
    }
    return res.status(400).json({ error: err.message || '上传失败' });
  }

  next(err);
});

// ===== 启动 =====
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🎨 Xiliu 运行在 http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`端口 ${port} 被占用，尝试使用 ${port + 1}`);
      startServer(port + 1);
      return;
    }

    console.error(err);
    process.exit(1);
  });
}

startServer(PORT);

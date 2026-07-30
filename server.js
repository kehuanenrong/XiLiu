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
const RECIPE_META_FILE = path.join(__dirname, 'data', 'recipes.json');

// 确保目录存在
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(META_FILE))) fs.mkdirSync(path.dirname(META_FILE), { recursive: true });
if (!fs.existsSync(MEME_DIR)) fs.mkdirSync(MEME_DIR, { recursive: true });

// 初始化菜谱数据文件（如果不存在）
if (!fs.existsSync(RECIPE_META_FILE)) {
  const defaultRecipes = [
    {
      id: 'default_1',
      title: '番茄炒蛋',
      image: '',
      category: '家常菜',
      difficulty: 1,
      time: '15分钟',
      ingredients: ['番茄 2个', '鸡蛋 3个', '盐 适量', '糖 少许', '葱花 适量'],
      steps: [
        '番茄切块，鸡蛋打散加少许盐搅匀',
        '热锅凉油，倒入蛋液炒至凝固盛出',
        '锅中加油，放入番茄翻炒出汁',
        '加入炒好的鸡蛋，加盐、糖调味',
        '撒上葱花，出锅装盘'
      ],
      tips: '番茄要炒出汁才好吃，鸡蛋不要炒太老',
      createdAt: new Date().toISOString()
    },
    {
      id: 'default_2',
      title: '可乐鸡翅',
      image: '',
      category: '家常菜',
      difficulty: 2,
      time: '30分钟',
      ingredients: ['鸡翅中 8个', '可乐 1罐', '生抽 2勺', '老抽 1勺', '姜片 3片'],
      steps: [
        '鸡翅两面划刀，冷水下锅焯水去腥',
        '热锅少油，放入鸡翅煎至两面金黄',
        '加入姜片、生抽、老抽翻炒上色',
        '倒入可乐，没过鸡翅，大火烧开',
        '转小火收汁至浓稠即可'
      ],
      tips: '用普通可乐，不要用零度或无糖的',
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(RECIPE_META_FILE, JSON.stringify(defaultRecipes, null, 2));
}

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

function readRecipeMeta() {
  try {
    return JSON.parse(fs.readFileSync(RECIPE_META_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeRecipeMeta(data) {
  fs.writeFileSync(RECIPE_META_FILE, JSON.stringify(data, null, 2));
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

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB，支持应用安装包

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
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

// ===== 菜谱 API =====

// 菜谱列表
app.get('/api/recipes', (req, res) => {
  const recipes = readRecipeMeta();
  res.json(recipes);
});

// 添加菜谱
app.post('/api/recipes', (req, res) => {
  const recipe = req.body;
  if (!recipe || !recipe.title) {
    return res.status(400).json({ error: '菜名不能为空' });
  }

  // 生成 ID
  recipe.id = genId();
  recipe.createdAt = new Date().toISOString();

  const recipes = readRecipeMeta();
  recipes.unshift(recipe);
  writeRecipeMeta(recipes);

  res.json(recipe);
});

// 删除菜谱
app.delete('/api/recipes/:id', (req, res) => {
  const recipes = readRecipeMeta();
  const idx = recipes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '菜谱不存在' });

  recipes.splice(idx, 1);
  writeRecipeMeta(recipes);

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
      return res.status(413).json({ error: '文件过大，最大支持 500MB' });
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

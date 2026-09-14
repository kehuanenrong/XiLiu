/**
 * 文件中心模块 - 使用后端 API
 * 注意：应用安装包类型文件已排除，由应用商店独立管理
 */
const FilesModule = {
  API_BASE: '/api/files',
  allFiles: [],
  currentFilter: 'all',
  showAll: false,
  defaultShow: 7,

  // 应用安装包扩展名列表（这些文件由应用商店管理）
  APP_EXTENSIONS: [
    'apk', 'aab', 'ipa',           // Android/iOS
    'exe', 'msi',                   // Windows
    'dmg', 'pkg',                   // macOS
    'deb', 'appimage', 'rpm', 'flatpak',  // Linux
    'tar', 'gz', 'tgz', 'tar.gz', 'tar.xz', 'tar.zst', 'zst', 'xz'  // 压缩包（可能包含安装包）
  ],

  init() {
    this.setupDropZone();
    this.loadFiles();
  },

  setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      e.target.value = '';
    });
  },

  handleFiles(fileList) {
    Array.from(fileList).forEach(file => this.uploadFile(file));
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${this.API_BASE}/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('上传失败');
      await res.json();
      this.loadFiles();
      App.toast(`"${file.name}" 上传成功！`, 'success');
    } catch (err) {
      App.toast(`上传失败: ${err.message}`, 'error');
    }
  },

  // 判断是否为应用安装包文件
  isAppFile(filename) {
    const lower = filename.toLowerCase();
    // 处理复合扩展名
    if (lower.endsWith('.tar.gz') || lower.endsWith('.tar.xz') || lower.endsWith('.tar.zst')) {
      return true;
    }
    const ext = lower.split('.').pop();
    return this.APP_EXTENSIONS.includes(ext);
  },

  async loadFiles() {
    try {
      const res = await fetch(this.API_BASE);
      const allFiles = await res.json();
      // 过滤掉应用安装包类型的文件
      this.allFiles = allFiles.filter(f => !this.isAppFile(f.name));
      this.renderList();
    } catch {
      document.getElementById('fileList').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p>无法连接服务器，请确认后端已启动</p>
        </div>
      `;
    }
  },

  // 分类筛选
  filterByType(type) {
    this.currentFilter = type;
    this.showAll = false;
    document.querySelectorAll('.file-filters .filter-tag').forEach(el => {
      el.classList.toggle('active', el.dataset.type === type);
    });
    this.renderList();
  },

  // 获取分类后的文件
  getFilteredFiles() {
    if (this.currentFilter === 'all') return this.allFiles;
    return this.allFiles.filter(f => {
      const t = f.type;
      switch (this.currentFilter) {
        case 'image': return t.startsWith('image/');
        case 'video': return t.startsWith('video/');
        case 'audio': return t.startsWith('audio/');
        case 'doc': return t.includes('pdf') || t.includes('word') || t.includes('sheet') ||
                       t.includes('presentation') || t.includes('text') || f.name.match(/\.(md|txt|csv)$/);
        default: return !t.startsWith('image/') && !t.startsWith('video/') && !t.startsWith('audio/') &&
                        !t.includes('pdf') && !t.includes('word') && !t.includes('sheet') &&
                        !t.includes('presentation') && !t.includes('text');
      }
    });
  },

  // 渲染列表（带分页）
  renderList() {
    const filtered = this.getFilteredFiles();
    const displayItems = this.showAll ? filtered : filtered.slice(0, this.defaultShow);
    const hasMore = filtered.length > this.defaultShow;

    // 文件列表
    const list = document.getElementById('fileList');
    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <p>${this.currentFilter === 'all' ? '还没有文件，拖拽或点击上传吧' : '该分类下暂无文件'}</p>
        </div>
      `;
    } else {
      list.innerHTML = displayItems.map(f => this.renderFileItem(f)).join('');
    }

    // 文件计数
    const countEl = document.getElementById('fileCount');
    if (countEl) {
      countEl.textContent = this.currentFilter === 'all'
        ? `共 ${filtered.length} 个文件`
        : `${this.getFilterName(this.currentFilter)} ${filtered.length} 个`;
    }

    // 展示更多 / 收起
    const moreEl = document.getElementById('fileShowMore');
    if (hasMore) {
      moreEl.innerHTML = this.showAll
        ? `<button class="show-more-btn" onclick="FilesModule.toggleShowAll(false)">收起 ▲</button>`
        : `<button class="show-more-btn" onclick="FilesModule.toggleShowAll(true)">Show More ▼ <span>(${filtered.length - this.defaultShow} 个更多)</span></button>`;
    } else {
      moreEl.innerHTML = '';
    }
  },

  toggleShowAll(show) {
    this.showAll = show;
    this.renderList();
  },

  getFilterName(type) {
    const names = { all: '全部', image: '图片', video: '视频', audio: '音频', doc: '文档', other: '其他' };
    return names[type] || '';
  },


  renderFileItem(file) {
    const icon = this.getFileIcon(file.type, file.name);
    const size = this.formatSize(file.size);
    const date = new Date(file.uploadedAt).toLocaleDateString('zh-CN');

    return `
      <div class="file-item">
        <div class="file-icon">${icon}</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">${size} · ${date}</div>
        </div>
        <div class="file-actions">
          <button class="btn btn-sm btn-secondary" onclick="FilesModule.preview('${file.id}')">预览</button>
          <button class="btn btn-sm btn-primary" onclick="FilesModule.download('${file.id}')">下载</button>
          <button class="btn btn-sm btn-danger" onclick="FilesModule.delete('${file.id}')">删除</button>
        </div>
      </div>
    `;
  },

  getFileIcon(type, name) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || (name && name.endsWith('.docx'))) return '📘';
    if (type.includes('sheet') || type.includes('excel') || (name && name.endsWith('.xlsx'))) return '📗';
    if (type.includes('presentation') || (name && name.endsWith('.pptx'))) return '📙';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '📦';
    if (type.includes('json')) return '📋';
    if (type.includes('javascript') || type.includes('typescript') || name?.match(/\.(js|ts|jsx|tsx)$/)) return '⚡';
    if (type.includes('html') || name?.match(/\.html?$/)) return '🌐';
    if (type.includes('css') || name?.match(/\.css$/)) return '🎨';
    if (type.includes('text') || name?.match(/\.(txt|md|csv)$/)) return '📝';
    return '📁';
  },

  getFileExtension(name) {
    return name.split('.').pop().toLowerCase();
  },

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  async preview(id) {
    const file = this.allFiles.find(f => f.id === id);
    if (!file) return;

    const fileExt = this.getFileExtension(file.name);
    const previewUrl = `${this.API_BASE}/${id}/preview`;
    let content = '';

    if (file.type.startsWith('image/')) {
      content = `<img src="${previewUrl}" class="image-preview" alt="${file.name}">`;
    } else if (file.type.startsWith('video/')) {
      content = `<video src="${previewUrl}" controls style="max-width:100%;border-radius:8px;"></video>`;
    } else if (file.type.startsWith('audio/')) {
      content = `<audio src="${previewUrl}" controls style="width:100%;"></audio>`;
    } else if (file.type === 'application/pdf' || fileExt === 'pdf') {
      content = `<iframe src="${previewUrl}" style="width:100%;height:70vh;border:none;border-radius:8px;"></iframe>`;
    } else if (file.type.includes('word') || fileExt === 'docx') {
      content = `<div id="wordPreview" style="text-align:left;padding:16px;max-height:70vh;overflow-y:auto;">
        <div class="loading-spinner"></div>
        <p style="color:var(--text-secondary);text-align:center;">正在解析 Word 文档...</p>
      </div>`;
    } else if (fileExt === 'doc') {
      content = `<div style="text-align:center;padding:40px;">
        <p style="font-size:2rem;">📘</p>
        <p style="color:var(--text-secondary);margin-top:12px;">旧版 .doc 格式暂不支持在线预览</p>
        <p style="color:var(--text-secondary);font-size:0.85rem;">请下载后使用 Word 打开</p>
      </div>`;
    } else if (fileExt === 'md') {
      try {
        const res = await fetch(previewUrl);
        const text = await res.text();
        if (typeof marked !== 'undefined') {
          const html = marked.parse(text);
          content = `<div class="markdown-body" style="text-align:left;padding:16px;max-height:70vh;overflow-y:auto;">${html}</div>`;
        } else {
          const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          content = `<pre style="text-align:left;background:var(--bg-secondary);padding:16px;border-radius:8px;max-height:70vh;overflow:auto;font-family:var(--font-mono);font-size:0.85rem;white-space:pre-wrap;">${escaped}</pre>`;
        }
      } catch {
        content = '<p style="color:var(--color-danger);">文件读取失败</p>';
      }
    } else if (file.type.startsWith('text') || fileExt.match(/^(txt|csv|json|xml|html|css|js|ts|jsx|tsx|py|java|c|cpp|sh|yaml|yml|toml)$/)) {
      try {
        const res = await fetch(previewUrl);
        const text = await res.text();
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        content = `<pre style="text-align:left;background:var(--bg-secondary);padding:16px;border-radius:8px;max-height:70vh;overflow:auto;font-family:var(--font-mono);font-size:0.85rem;white-space:pre-wrap;word-break:break-all;">${escaped}</pre>`;
      } catch {
        content = '<p style="color:var(--color-danger);">文件读取失败</p>';
      }
    } else {
      content = `<div style="text-align:center;padding:40px;">
        <p style="font-size:2rem;">${this.getFileIcon(file.type, file.name)}</p>
        <p style="color:var(--text-secondary);margin-top:12px;">此文件类型暂不支持在线预览</p>
        <p style="color:var(--text-secondary);font-size:0.85rem;">请下载后使用对应软件打开</p>
      </div>`;
    }

    App.showModal(`
      <div class="modal-header">
        <h3>${this.getFileIcon(file.type, file.name)} ${file.name}</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div style="padding:16px 0;">${content}</div>
    `);

    if (file.type.includes('word') || fileExt === 'docx') {
      setTimeout(() => this.renderWordDoc(id), 100);
    }
  },

  download(id) {
    window.open(`${this.API_BASE}/${id}/download`, '_blank');
    App.toast('开始下载...', 'info');
  },

  async delete(id) {
    if (!confirm('确定要删除这个文件吗？')) return;
    try {
      await fetch(`${this.API_BASE}/${id}`, { method: 'DELETE' });
      this.loadFiles();
      App.toast('文件已删除', 'info');
    } catch {
      App.toast('删除失败', 'error');
    }
  },

  async renderWordDoc(id) {
    const container = document.getElementById('wordPreview');
    if (!container || typeof mammoth === 'undefined') {
      if (container) container.innerHTML = '<p style="color:var(--color-danger);">mammoth.js 加载失败</p>';
      return;
    }
    try {
      const res = await fetch(`${this.API_BASE}/${id}/preview`);
      const arrayBuffer = await res.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      container.innerHTML = `<div style="font-family:var(--font-main);line-height:1.8;">${result.value}</div>`;
    } catch (err) {
      container.innerHTML = `<p style="color:var(--color-danger);">解析失败: ${err.message}</p>`;
    }
  }
};

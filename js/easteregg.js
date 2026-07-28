/**
 * 隐藏彩蛋模块
 * 触发方式：在 Logo 旁输入 "Xiliu"
 */
const EasterEgg = {
  STORAGE_KEY_MEMES: 'xiliu_memes',
  STORAGE_KEY_MESSAGES: 'xiliu_secret_messages',
  MEME_DB_NAME: 'xiliu_memes_db',
  MEME_DB_VERSION: 1,
  MEME_STORE_NAME: 'memes',
  gameActive: false,
  gameScore: 0,
  gameTimer: null,
  gameMoles: [],

  init() {
    this.setupTrigger();
  },

  // ===== 触发机制 =====
  setupTrigger() {
    const input = document.getElementById('secretInput');
    if (!input) return;

    input.addEventListener('input', () => {
      if (input.value.trim() === 'Xiliu') {
        input.value = '';
        input.blur();
        this.unlock();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (input.value.trim() === 'Xiliu') {
          input.value = '';
          input.blur();
          this.unlock();
        }
      }
    });
  },

  unlock() {
    App.toast('🎉 你发现了隐藏彩蛋！', 'success');
    setTimeout(() => this.showPage(), 500);
  },

  // ===== 彩蛋页面 =====
  showPage() {
    App.showModal(`
      <div class="modal-header">
        <h3>🎉 秘密基地</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="egg-tabs">
        <button class="egg-tab active" onclick="EasterEgg.switchTab('memes')">🎭 表情包</button>
        <button class="egg-tab" onclick="EasterEgg.switchTab('verse')">📖 每日金句</button>
        <button class="egg-tab" onclick="EasterEgg.switchTab('game')">🐹 打地鼠</button>
        <button class="egg-tab" onclick="EasterEgg.switchTab('confetti')">🎊 撒花</button>
        <button class="egg-tab" onclick="EasterEgg.switchTab('secrets')">💌 留言</button>
      </div>
      <div id="eggContent" class="egg-content"></div>
    `);
    document.getElementById('modalContent').style.maxWidth = '700px';
    this.switchTab('memes');
  },

  switchTab(tab) {
    document.querySelectorAll('.egg-tab').forEach((el, i) => {
      el.classList.toggle('active', ['memes', 'verse', 'game', 'confetti', 'secrets'][i] === tab);
    });
    const content = document.getElementById('eggContent');
    switch (tab) {
      case 'memes':
        content.innerHTML = this.renderMemes();
        this.refreshMemes();
        break;
      case 'verse': content.innerHTML = this.renderVerse(); break;
      case 'game': content.innerHTML = this.renderGame(); break;
      case 'confetti': content.innerHTML = this.renderConfetti(); break;
      case 'secrets': content.innerHTML = this.renderSecrets(); break;
    }
  },

  // ===== 表情包画廊 =====
  renderMemes() {
    return `
      <div class="egg-meme-upload">
        <label for="memeInput" class="btn btn-primary btn-sm">📤 上传表情包</label>
        <input type="file" id="memeInput" accept="image/*" multiple hidden onchange="EasterEgg.handleMemeUpload(event)">
        <span style="color:var(--text-secondary);font-size:0.85rem;">支持 JPG/PNG/GIF</span>
      </div>
      <div class="egg-meme-grid" id="memeGrid"><div class="empty-state"><div class="empty-state-icon">⏳</div><p>正在加载表情包...</p></div></div>
    `;
  },

  async handleMemeUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 尝试上传到后端
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const res = await fetch('api/memes/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('上传失败');
      await res.json();

      // 重新加载表情包列表
      await this.refreshMemes();
      App.toast(`成功上传 ${files.length} 张表情包！`, 'success');
    } catch {
      // 后端不可用时，回退到本地存储
      const memes = await this.getMemes();
      let loaded = 0;
      let failed = false;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          memes.push({
            id: Storage.generateId(),
            name: file.name,
            data: ev.target.result,
            uploadedAt: new Date().toISOString()
          });
          loaded++;
          if (loaded === files.length) {
            if (failed) return;

            const saved = await this.saveMemes(memes);
            if (!saved) {
              App.toast('表情包太大，浏览器存储空间不足', 'error');
              return;
            }

            this.refreshMemes(memes);
            App.toast(`成功上传 ${files.length} 张表情包！`, 'success');
          }
        };
        reader.onerror = () => {
          failed = true;
          App.toast(`读取文件失败: ${file.name}`, 'error');
        };
        reader.readAsDataURL(file);
      });
    }

    if (e.target) e.target.value = '';
  },

  async refreshMemes(memes = null) {
    const content = document.getElementById('eggContent');
    if (!content) return;

    const grid = content.querySelector('.egg-meme-grid');
    if (!grid) return;

    let items;
    if (memes) {
      items = memes;
    } else {
      // 尝试从后端加载（添加时间戳防止缓存）
      try {
        const res = await fetch(`api/memes?t=${Date.now()}`);
        if (!res.ok) throw new Error('加载失败');
        items = await res.json();
        // 转换为前端格式（后端返回的是元数据，需要构建完整的 meme 对象）
        items = items.map(m => ({
          id: m.id,
          name: m.name,
          data: m.url,
          uploadedAt: m.uploadedAt
        }));
      } catch {
        // 后端不可用时，回退到本地存储
        items = await this.getMemes();
      }
    }

    const gallery = items.length > 0
      ? items.map(m => `
          <div class="egg-meme-item">
            <img src="${m.data}?t=${Date.now()}" alt="${m.name}" onclick="EasterEgg.previewMeme('${m.id}')">
            <button class="egg-meme-del" onclick="EasterEgg.deleteMeme('${m.id}')">✕</button>
          </div>
        `).join('')
      : '<div class="empty-state"><div class="empty-state-icon">🎭</div><p>还没有表情包，上传一些吧</p></div>';

    grid.innerHTML = gallery;
  },

  async previewMeme(id) {
    // 尝试从后端获取
    let meme;
    try {
      const res = await fetch('api/memes');
      if (!res.ok) throw new Error('加载失败');
      const memes = await res.json();
      meme = memes.find(m => m.id === id);
      if (meme) {
        meme = { ...meme, data: meme.url };
      }
    } catch {
      // 后端不可用时，回退到本地存储
      meme = (await this.getMemes()).find(m => m.id === id);
    }

    if (!meme) return;
    App.showModal(`
      <div class="modal-header">
        <h3>${meme.name}</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div style="text-align:center;padding:16px;">
        <img src="${meme.data}" style="max-width:100%;max-height:70vh;border-radius:8px;">
      </div>
    `);
  },

  async deleteMeme(id) {
    if (!confirm('确定删除这张表情包？')) return;

    // 尝试从后端删除
    try {
      const res = await fetch(`api/memes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');

      // 重新加载表情包列表
      await this.refreshMemes();
      App.toast('已删除', 'info');
    } catch {
      // 后端不可用时，回退到本地存储
      const memes = (await this.getMemes()).filter(m => m.id !== id);
      await this.saveMemes(memes);
      this.refreshMemes(memes);
      App.toast('已删除', 'info');
    }
  },

  openMemeDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        resolve(null);
        return;
      }

      const request = indexedDB.open(this.MEME_DB_NAME, this.MEME_DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.MEME_STORE_NAME)) {
          db.createObjectStore(this.MEME_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getMemes() {
    try {
      const db = await this.openMemeDB();
      if (!db) return Storage.get(this.STORAGE_KEY_MEMES, []);

      return await new Promise((resolve, reject) => {
        const tx = db.transaction(this.MEME_STORE_NAME, 'readonly');
        const store = tx.objectStore(this.MEME_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return Storage.get(this.STORAGE_KEY_MEMES, []);
    }
  },

  async saveMemes(memes) {
    try {
      const db = await this.openMemeDB();
      if (!db) return Storage.set(this.STORAGE_KEY_MEMES, memes);

      await new Promise((resolve, reject) => {
        const tx = db.transaction(this.MEME_STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.MEME_STORE_NAME);
        store.clear();
        memes.forEach(meme => store.put(meme));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      return true;
    } catch {
      return Storage.set(this.STORAGE_KEY_MEMES, memes);
    }
  },

  // ===== 每日金句 =====
  renderVerse() {
    const STORAGE_KEY_VERSE = 'xiliu_daily_verse';
    const today = new Date().toISOString().slice(0, 10);
    const saved = Storage.get(STORAGE_KEY_VERSE);

    // 每天只抽一次，点击可刷新
    let currentVerse;
    if (saved && saved.date === today && !saved.refreshed) {
      currentVerse = saved;
    } else {
      currentVerse = this.drawNewVerse(false);
    }

    return `
      <div class="egg-verse">
        <div class="egg-verse-icon">📖</div>
        <div id="verseResult" class="egg-verse-result">
          <p class="egg-verse-text">"${currentVerse.text}"</p>
          <p class="egg-verse-ref">—— ${currentVerse.ref}</p>
        </div>
        <button class="btn btn-primary" onclick="EasterEgg.refreshVerse()">
          🔄 换一节
        </button>
        <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:12px;">每天自动更新，也可手动刷新</p>
      </div>
    `;
  },

  drawNewVerse(isRefresh = true) {
    const verses = [
      { text: '你要专心仰赖耶和华，不可倚靠自己的聪明，在你一切所行的事上都要认定他，他必指引你的路。', ref: '箴言 3:5-6' },
      { text: '我留下平安给你们，我将我的平安赐给你们。我所赐的，不像世人所赐的；你们心里不要忧愁，也不要胆怯。', ref: '约翰福音 14:27' },
      { text: '应当一无挂虑，只要凡事借着祷告、祈求和感谢，将你们所要的告诉神。神所赐出人意外的平安，必在基督耶稣里保守你们的心怀意念。', ref: '腓立比书 4:6-7' },
      { text: '我靠着那加给我力量的，凡事都能做。', ref: '腓立比书 4:13' },
      { text: '你们要将一切的忧虑卸给神，因为他顾念你们。', ref: '彼得前书 5:7' },
      { text: '耶和华是我的牧者，我必不至缺乏。他使我躺卧在青草地上，领我在可安歇的水边。', ref: '诗篇 23:1-2' },
      { text: '但那等候耶和华的，必从新得力。他们必如鹰展翅上腾，他们奔跑却不困倦，行走却不疲乏。', ref: '以赛亚书 40:31' },
      { text: '神是我们的避难所，是我们的力量，是我们在患难中随时的帮助。', ref: '诗篇 46:1' },
      { text: '因为神赐给我们不是胆怯的心，乃是刚强、仁爱、谨守的心。', ref: '提摩太后书 1:7' },
      { text: '我必与你同在。', ref: '出埃及记 3:12' },
      { text: '你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。', ref: '马太福音 7:7' },
      { text: '喜乐的心，乃是良药；忧伤的灵，使骨枯干。', ref: '箴言 17:22' },
      { text: '万事都互相效力，叫爱神的人得益处。', ref: '罗马书 8:28' },
      { text: '我来是要叫羊得生命，并且得的更丰盛。', ref: '约翰福音 10:10' },
      { text: '爱是恒久忍耐，又有恩慈；爱是不嫉妒，爱是不自夸，不张狂。', ref: '哥林多前书 13:4' },
      { text: '你的话是我脚前的灯，是我路上的光。', ref: '诗篇 119:105' },
      { text: '在世上你们有苦难，但你们可以放心，我已经胜了世界。', ref: '约翰福音 16:33' },
      { text: '看哪，我常与你们同在，直到世界的末了。', ref: '马太福音 28:20' },
      { text: '他使我的灵魂苏醒，为自己的名引导我走义路。', ref: '诗篇 23:3' },
      { text: '你们是世上的光。城造在山上，是不能隐藏的。', ref: '马太福音 5:14' },
      { text: '我们行善，不可丧志，若不灰心，到了时候就要收成。', ref: '加拉太书 6:9' },
      { text: '所以，不要为明天忧虑，因为明天自有明天的忧虑；一天的难处一天当就够了。', ref: '马太福音 6:34' },
      { text: '你不要害怕，因为我与你同在；不要惊惶，因为我是你的神。我必坚固你，我必帮助你。', ref: '以赛亚书 41:10' },
      { text: '耶和华必在你前面行，他必与你同在，必不撇下你，也不丢弃你。不要惧怕，也不要惊惶。', ref: '申命记 31:8' },
    ];

    const verse = verses[Math.floor(Math.random() * verses.length)];
    const today = new Date().toISOString().slice(0, 10);

    Storage.set('xiliu_daily_verse', { ...verse, date: today, refreshed: isRefresh });

    if (isRefresh) {
      const el = document.getElementById('verseResult');
      el.innerHTML = `
        <p class="egg-verse-text">"${verse.text}"</p>
        <p class="egg-verse-ref">—— ${verse.ref}</p>
      `;
      el.classList.remove('animate-scale-in');
      void el.offsetWidth;
      el.classList.add('animate-scale-in');
    }

    return verse;
  },

  refreshVerse() {
    this.drawNewVerse(true);
    App.toast('已为你换一节金句 ✨', 'info');
  },

  // ===== 打地鼠游戏 =====
  renderGame() {
    this.gameScore = 0;
    this.gameActive = false;
    return `
      <div class="egg-game">
        <div class="egg-game-header">
          <span>得分: <b id="gameScore">0</b></span>
          <span>时间: <b id="gameTime">15</b>s</span>
        </div>
        <div class="egg-game-grid">
          ${Array.from({length: 9}, (_, i) => `
            <div class="egg-game-hole" onclick="EasterEgg.whack(${i})">
              <div class="egg-game-mole" id="mole${i}">🐹</div>
            </div>
          `).join('')}
        </div>
        <button id="gameStartBtn" class="btn btn-primary" onclick="EasterEgg.startGame()">🎮 开始游戏</button>
      </div>
    `;
  },

  startGame() {
    this.gameScore = 0;
    this.gameActive = true;
    this.gameMoles = Array(9).fill(false);
    document.getElementById('gameScore').textContent = '0';
    document.getElementById('gameStartBtn').disabled = true;
    document.getElementById('gameStartBtn').textContent = '游戏进行中...';

    let time = 15;
    const timeEl = document.getElementById('gameTime');
    timeEl.textContent = time;

    // 倒计时
    this.gameTimer = setInterval(() => {
      time--;
      timeEl.textContent = time;
      if (time <= 0) {
        this.endGame();
      }
    }, 1000);

    // 随机出地鼠
    this.spawnMole();
  },

  spawnMole() {
    if (!this.gameActive) return;

    // 先全部隐藏
    this.gameMoles.fill(false);
    for (let i = 0; i < 9; i++) {
      const mole = document.getElementById(`mole${i}`);
      if (mole) mole.classList.remove('active');
    }

    // 随机选 1-2 个洞
    const count = Math.random() > 0.5 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const idx = Math.floor(Math.random() * 9);
      this.gameMoles[idx] = true;
      const mole = document.getElementById(`mole${idx}`);
      if (mole) mole.classList.add('active');
    }

    // 800-1500ms 后换位置
    setTimeout(() => this.spawnMole(), 800 + Math.random() * 700);
  },

  whack(index) {
    if (!this.gameActive || !this.gameMoles[index]) return;
    this.gameScore++;
    this.gameMoles[index] = false;
    const mole = document.getElementById(`mole${index}`);
    if (mole) {
      mole.classList.remove('active');
      mole.classList.add('whacked');
      setTimeout(() => mole.classList.remove('whacked'), 300);
    }
    document.getElementById('gameScore').textContent = this.gameScore;
  },

  endGame() {
    this.gameActive = false;
    clearInterval(this.gameTimer);
    this.gameMoles.fill(false);
    for (let i = 0; i < 9; i++) {
      const mole = document.getElementById(`mole${i}`);
      if (mole) mole.classList.remove('active');
    }

    const btn = document.getElementById('gameStartBtn');
    btn.disabled = false;
    btn.textContent = '🎮 再来一局';

    let rank = '手残党 😅';
    if (this.gameScore >= 20) rank = '地鼠克星 👑';
    else if (this.gameScore >= 15) rank = '打鼠达人 🏆';
    else if (this.gameScore >= 10) rank = '速度不错 🥈';
    else if (this.gameScore >= 5) rank = '初出茅庐 🌱';

    App.toast(`游戏结束！得分 ${this.gameScore}，${rank}`, 'success');
  },

  // ===== 撒花 =====
  renderConfetti() {
    return `
      <div class="egg-confetti-page">
        <div class="egg-confetti-icon">🎊</div>
        <h3 style="margin:16px 0;">快乐就是要分享！</h3>
        <p style="color:var(--text-secondary);margin-bottom:24px;">点击按钮，为生活撒点花</p>
        <button class="btn btn-primary egg-confetti-btn" onclick="EasterEgg.fireConfetti()">
          🎉 撒花！
        </button>
        <button class="btn btn-secondary" onclick="EasterEgg.fireConfetti(50)" style="margin-left:8px;">
          🎆 超级撒花
        </button>
      </div>
    `;
  },

  fireConfetti(count = 25) {
    const colors = ['#6c5ce7', '#fd79a8', '#fdcb6e', '#00b894', '#e17055', '#0984e3', '#a29bfe'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const size = 6 + Math.random() * 8;
        const rotation = Math.random() * 360;
        const duration = 2 + Math.random() * 2;
        const shape = Math.random() > 0.5 ? '50%' : '0';

        confetti.style.cssText = `
          position:absolute;
          top:-10px;
          left:${left}%;
          width:${size}px;
          height:${size * 0.6}px;
          background:${color};
          border-radius:${shape};
          transform:rotate(${rotation}deg);
          animation:confettiFall ${duration}s ease-in forwards;
        `;
        container.appendChild(confetti);
      }, i * 40);
    }

    // 添加动画样式
    if (!document.getElementById('confettiStyle')) {
      const style = document.createElement('style');
      style.id = 'confettiStyle';
      style.textContent = `
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => container.remove(), 5000);
  },

  // ===== 秘密留言板 =====
  renderSecrets() {
    const messages = Storage.get(this.STORAGE_KEY_MESSAGES, []);
    const list = messages.length > 0
      ? messages.map(m => `
          <div class="egg-secret-msg animate-fade-in">
            <div class="egg-secret-emoji">${m.emoji}</div>
            <div class="egg-secret-text">${m.text}</div>
            <div class="egg-secret-time">${new Date(m.time).toLocaleString('zh-CN')}</div>
          </div>
        `).join('')
      : '<div class="empty-state"><div class="empty-state-icon">💌</div><p>还没有秘密，留下第一条吧</p></div>';

    const emojis = ['😊', '😂', '🥺', '😎', '🤡', '👻', '💀', '🤡', '🐱', '🐶', '🦊', '🐸', '🌈', '🔥', '💀', '🤖'];

    return `
      <div class="egg-secrets">
        <div class="egg-secret-input">
          <div class="emoji-picker" id="emojiPicker">
            ${emojis.map((e, i) => `<span class="emoji-option ${i === 0 ? 'selected' : ''}" onclick="EasterEgg.selectEmoji(this, '${e}')">${e}</span>`).join('')}
          </div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <input type="text" id="secretText" placeholder="说点什么秘密..." maxlength="100">
            <button class="btn btn-primary btn-sm" onclick="EasterEgg.postSecret()">发送</button>
          </div>
        </div>
        <div class="egg-secret-list">${list}</div>
      </div>
    `;
  },

  selectEmoji(el, emoji) {
    document.querySelectorAll('.emoji-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    this._selectedEmoji = emoji;
  },

  postSecret() {
    const text = document.getElementById('secretText').value.trim();
    if (!text) {
      App.toast('请输入内容', 'error');
      return;
    }

    const messages = Storage.get(this.STORAGE_KEY_MESSAGES, []);
    messages.unshift({
      id: Storage.generateId(),
      emoji: this._selectedEmoji || '😊',
      text,
      time: new Date().toISOString()
    });
    Storage.set(this.STORAGE_KEY_MESSAGES, messages);
    this.switchTab('secrets');
    App.toast('秘密已发送 💌', 'success');
  }
};

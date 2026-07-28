/**
 * 主应用逻辑
 */
const App = {
  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupScrollEffects();
    AboutModule.init();
    FilesModule.init();
    MenuModule.init();
    EasterEgg.init();
  },

  // ===== 主题切换 =====
  setupTheme() {
    const saved = Storage.get('xiliu_theme', 'light');
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);

    document.getElementById('themeToggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      Storage.set('xiliu_theme', next);
      this.updateThemeIcon(next);
    });
  },

  updateThemeIcon(theme) {
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  // ===== 导航 =====
  setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    const toggle = document.getElementById('mobileToggle');
    const navLinks = document.querySelector('.nav-links');

    // 平滑滚动 + 高亮
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        navLinks.classList.remove('active');
      });
    });

    // 移动端菜单
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // 滚动时高亮
    window.addEventListener('scroll', () => {
      const sections = document.querySelectorAll('.section');
      let current = '';
      sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) {
          current = section.getAttribute('id');
        }
      });
      links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    });
  },

  // ===== 滚动特效 =====
  setupScrollEffects() {
    // 进度条
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);

    // 导航栏阴影
    const navbar = document.querySelector('.navbar');

    // 滚动监听
    window.addEventListener('scroll', () => {
      // 进度条
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? scrollTop / docHeight : 0;
      progress.style.transform = `scaleX(${ratio})`;

      // 导航栏阴影
      navbar.classList.toggle('scrolled', scrollTop > 10);
    });

    // Intersection Observer - 滚动入场
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    // 标记需要滚动动画的元素
    this.markScrollElements(observer);
  },

  markScrollElements(observer) {
    // 为各区块添加浮动装饰
    this.addSectionDecorations();

    // 区块标题
    document.querySelectorAll('.section-header').forEach(el => {
      el.classList.add('scroll-reveal');
      observer.observe(el);
    });

    // 首页 feature cards
    document.querySelectorAll('.feature-card').forEach((el, i) => {
      el.classList.add('scroll-reveal', 'scroll-scale', `delay-${i + 1}`);
      observer.observe(el);
    });

    // 团队成员卡片
    document.querySelectorAll('.member-card').forEach((el, i) => {
      el.classList.add('scroll-reveal', `delay-${Math.min(i + 1, 6)}`);
      observer.observe(el);
    });

    // 文件上传区域
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.classList.add('scroll-reveal');
      observer.observe(dropZone);
    }

    // 菜谱卡片
    document.querySelectorAll('.recipe-card').forEach((el, i) => {
      el.classList.add('scroll-reveal', 'scroll-scale', `delay-${Math.min(i + 1, 6)}`);
      observer.observe(el);
    });

    // 文件列表项（左侧滑入）
    document.querySelectorAll('.file-item').forEach((el, i) => {
      el.classList.add('scroll-reveal', 'scroll-left', `delay-${Math.min(i + 1, 6)}`);
      observer.observe(el);
    });

    // 菜谱操作栏（右侧滑入）
    document.querySelectorAll('.menu-actions').forEach(el => {
      el.classList.add('scroll-reveal', 'scroll-right');
      observer.observe(el);
    });
  },

  addSectionDecorations() {
    const decoData = {
      about: [
        { type: 'circle', color: 'rgba(108, 92, 231, 0.15)', size: 120, top: '10%', left: '5%', delay: '0s' },
        { type: 'circle', color: 'rgba(253, 121, 168, 0.12)', size: 80, top: '60%', right: '8%', delay: '2s' },
        { type: 'emoji', content: '✨', top: '20%', right: '12%', delay: '1s' },
        { type: 'emoji', content: '🚀', bottom: '15%', left: '10%', delay: '3s' },
      ],
      files: [
        { type: 'circle', color: 'rgba(253, 203, 110, 0.12)', size: 100, top: '15%', right: '5%', delay: '1s' },
        { type: 'circle', color: 'rgba(0, 184, 148, 0.12)', size: 90, bottom: '20%', left: '3%', delay: '0.5s' },
        { type: 'emoji', content: '📂', top: '8%', left: '8%', delay: '2s' },
        { type: 'emoji', content: '📎', bottom: '10%', right: '10%', delay: '4s' },
      ],
      menu: [
        { type: 'circle', color: 'rgba(253, 121, 168, 0.12)', size: 110, top: '12%', left: '3%', delay: '0.5s' },
        { type: 'circle', color: 'rgba(108, 92, 231, 0.1)', size: 70, bottom: '25%', right: '5%', delay: '2.5s' },
        { type: 'emoji', content: '🍳', top: '5%', right: '8%', delay: '1.5s' },
        { type: 'emoji', content: '🥗', bottom: '12%', left: '6%', delay: '3.5s' },
        { type: 'emoji', content: '🍴', top: '45%', right: '3%', delay: '0s' },
      ]
    };

    Object.entries(decoData).forEach(([sectionId, decos]) => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      decos.forEach(d => {
        const el = document.createElement('div');
        el.className = `section-deco ${d.type}`;
        el.style.animationDelay = d.delay;

        if (d.type === 'circle') {
          el.style.width = d.size + 'px';
          el.style.height = d.size + 'px';
          el.style.background = d.color;
        } else {
          el.textContent = d.content;
        }

        if (d.top) el.style.top = d.top;
        if (d.bottom) el.style.bottom = d.bottom;
        if (d.left) el.style.left = d.left;
        if (d.right) el.style.right = d.right;

        section.appendChild(el);
      });
    });
  },

  // ===== 模态框 =====
  showModal(content) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modalContent');
    modal.innerHTML = content;
    overlay.classList.remove('hidden');

    // 点击遮罩关闭
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };

    // ESC 关闭
    document.addEventListener('keydown', this._escHandler = (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
  },

  // ===== Toast 提示 =====
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-fade-in-up`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());

/**
 * 信息通知栏模块 - 使用后端 API 实现多用户同步
 */
const NoticeModule = {
  API_BASE: '/api/notices',

  // 通知类型配置
  typeConfig: {
    announcement: { icon: '📋', label: '公告', color: '#6c5ce7' },
    activity: { icon: '🎉', label: '活动', color: '#00b894' },
    reminder: { icon: '⏰', label: '提醒', color: '#fdcb6e' },
    important: { icon: '❗', label: '重要', color: '#d63031' }
  },

  // 本地缓存
  notices: [],
  currentFilter: 'all',

  async init() {
    document.getElementById('addNoticeBtn').addEventListener('click', () => this.showAddModal());
    await this.loadNotices();
  },

  // 从服务器获取通知列表
  async loadNotices() {
    try {
      const response = await fetch(this.API_BASE);
      if (!response.ok) throw new Error('获取通知失败');
      this.notices = await response.json();
      this.renderNotices();
    } catch (error) {
      console.error('加载通知失败:', error);
      App.toast('加载通知失败，请刷新重试', 'error');
    }
  },

  // 渲染通知列表
  renderNotices() {
    const filtered = this.currentFilter === 'all'
      ? this.notices
      : this.notices.filter(n => n.type === this.currentFilter);

    const list = document.getElementById('noticeList');
    const count = document.getElementById('noticeCount');

    // 更新计数
    const unreadCount = this.notices.filter(n => !n.isRead).length;
    count.textContent = `共 ${this.notices.length} 条通知${unreadCount > 0 ? `，${unreadCount} 条未读` : ''}`;

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>暂无通知</p>
        </div>
      `;
      return;
    }

    // 按时间倒序排列
    filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    list.innerHTML = filtered.map((notice, i) => this.renderNotice(notice, i)).join('');
  },

  renderNotice(notice, index) {
    const config = this.typeConfig[notice.type] || this.typeConfig.announcement;
    const timeStr = this.formatTime(notice.time);
    const readClass = notice.isRead ? 'read' : 'unread';

    return `
      <div class="notice-card ${readClass} animate-fade-in-up stagger-${Math.min(index + 1, 5)}"
           onclick="NoticeModule.showDetail('${notice.id}')">
        <div class="notice-header">
          <div class="notice-type" style="background: ${config.color}20; color: ${config.color}">
            <span>${config.icon}</span>
            <span>${config.label}</span>
          </div>
          <div class="notice-time">${timeStr}</div>
        </div>
        <div class="notice-title">
          ${!notice.isRead ? '<span class="unread-dot"></span>' : ''}
          ${this.escapeHtml(notice.title)}
        </div>
        <div class="notice-preview">${this.truncate(this.escapeHtml(notice.content), 80)}</div>
        <div class="notice-footer">
          <span class="notice-author">👤 ${this.escapeHtml(notice.author)}</span>
          <div class="notice-actions" onclick="event.stopPropagation()">
            ${!notice.isRead ? `<button class="btn-text" onclick="NoticeModule.markRead('${notice.id}')">标为已读</button>` : ''}
            <button class="btn-text btn-danger-text" onclick="NoticeModule.deleteNotice('${notice.id}')">删除</button>
          </div>
        </div>
      </div>
    `;
  },

  async showDetail(id) {
    const notice = this.notices.find(n => n.id === id);
    if (!notice) return;

    const config = this.typeConfig[notice.type] || this.typeConfig.announcement;
    const timeStr = this.formatTime(notice.time);

    // 标记为已读
    if (!notice.isRead) {
      await this.markRead(id, false);
    }

    App.showModal(`
      <div class="modal-header">
        <h3>${config.icon} 通知详情</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="notice-detail">
        <div class="notice-detail-type" style="background: ${config.color}20; color: ${config.color}">
          ${config.icon} ${config.label}
        </div>
        <h2 class="notice-detail-title">${this.escapeHtml(notice.title)}</h2>
        <div class="notice-detail-meta">
          <span>👤 ${this.escapeHtml(notice.author)}</span>
          <span>🕐 ${timeStr}</span>
        </div>
        <div class="notice-detail-content">${this.escapeHtml(notice.content)}</div>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <button class="btn btn-danger btn-sm" onclick="NoticeModule.deleteNotice('${notice.id}')">删除通知</button>
      </div>
    `);
  },

  showAddModal() {
    App.showModal(`
      <div class="modal-header">
        <h3>✏️ 发布新通知</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <form id="addNoticeForm" onsubmit="NoticeModule.handleAdd(event)">
        <div class="form-group">
          <label>通知类型</label>
          <select id="noticeType" required>
            <option value="announcement">📋 公告</option>
            <option value="activity">🎉 活动</option>
            <option value="reminder">⏰ 提醒</option>
            <option value="important">❗ 重要</option>
          </select>
        </div>
        <div class="form-group">
          <label>标题</label>
          <input type="text" id="noticeTitle" placeholder="输入通知标题" required>
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea id="noticeContent" placeholder="输入通知内容" rows="4" required></textarea>
        </div>
        <div class="form-group">
          <label>发布者</label>
          <input type="text" id="noticeAuthor" placeholder="输入发布者名称" value="匿名" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">发布通知</button>
      </form>
    `);
  },

  async handleAdd(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '发布中...';

    const newNotice = {
      title: document.getElementById('noticeTitle').value,
      content: document.getElementById('noticeContent').value,
      type: document.getElementById('noticeType').value,
      author: document.getElementById('noticeAuthor').value || '匿名'
    };

    try {
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotice)
      });

      if (!response.ok) throw new Error('发布失败');

      await this.loadNotices();
      App.closeModal();
      App.toast('通知发布成功！', 'success');
    } catch (error) {
      console.error('发布通知失败:', error);
      App.toast('发布失败，请重试', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '发布通知';
    }
  },

  async markRead(id, showToast = true) {
    try {
      const response = await fetch(`${this.API_BASE}/${id}/read`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('标记失败');

      // 更新本地缓存
      const notice = this.notices.find(n => n.id === id);
      if (notice) notice.isRead = true;

      this.renderNotices();
      if (showToast) {
        App.toast('已标为已读', 'info');
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      App.toast('操作失败，请重试', 'error');
    }
  },

  async deleteNotice(id) {
    if (!confirm('确定要删除这条通知吗？')) return;

    try {
      const response = await fetch(`${this.API_BASE}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('删除失败');

      await this.loadNotices();
      App.closeModal();
      App.toast('通知已删除', 'info');
    } catch (error) {
      console.error('删除通知失败:', error);
      App.toast('删除失败，请重试', 'error');
    }
  },

  filterByType(type) {
    this.currentFilter = type;

    // 更新按钮状态
    document.querySelectorAll('.notice-filters .filter-tag').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    this.renderNotices();
  },

  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    // 小于1分钟
    if (diff < 60000) return '刚刚';
    // 小于1小时
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    // 小于24小时
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    // 小于7天
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    // 超过7天显示具体日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (year === now.getFullYear()) {
      return `${month}-${day} ${hours}:${minutes}`;
    }
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // HTML 转义防 XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

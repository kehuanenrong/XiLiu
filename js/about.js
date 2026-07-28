/**
 * 关于我们 - 团队成员模块
 */
const AboutModule = {
  STORAGE_KEY: 'xiliu_team_members',

  // 默认成员数据
  defaultMembers: [
    {
      id: '1',
      name: '小六',
      avatar: '🦊',
      role: '队长 / 全栈开发',
      signature: '代码写得好，饭也做得好',
      skills: ['JavaScript', 'Python', '烹饪', '摸鱼']
    },
    {
      id: '2',
      name: '阿橘',
      avatar: '🐱',
      role: '前端工程师',
      signature: 'CSS 是我的画笔，浏览器是我的画布',
      skills: ['Vue', 'CSS', '设计', '猫奴']
    },
    {
      id: '3',
      name: '大白',
      avatar: '🐻',
      role: '后端工程师',
      signature: '数据库里藏着所有秘密',
      skills: ['Java', 'MySQL', '健身', '干饭']
    },
    {
      id: '4',
      name: '小星',
      avatar: '⭐',
      role: 'UI 设计师',
      signature: '像素级强迫症患者',
      skills: ['Figma', '配色', '摄影', '追剧']
    }
  ],

  init() {
    this.loadMembers();
    document.getElementById('addMemberBtn').addEventListener('click', () => this.showAddModal());
  },

  getMembers() {
    return Storage.get(this.STORAGE_KEY, this.defaultMembers);
  },

  loadMembers() {
    const members = this.getMembers();
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = members.map((m, i) => this.renderCard(m, i)).join('');
  },

  renderCard(member, index) {
    return `
      <div class="member-card animate-fade-in-up stagger-${Math.min(index + 1, 5)}" onclick="AboutModule.showDetail('${member.id}')">
        <div class="member-avatar">${member.avatar}</div>
        <div class="member-name">${member.name}</div>
        <div class="member-role">${member.role}</div>
        <div class="member-signature">"${member.signature}"</div>
        <div class="member-skills">
          ${member.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      </div>
    `;
  },

  showDetail(id) {
    const member = this.getMembers().find(m => m.id === id);
    if (!member) return;

    App.showModal(`
      <div class="modal-header">
        <h3>${member.avatar} ${member.name}</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div style="text-align: center; padding: 20px 0;">
        <div class="member-avatar" style="width:100px;height:100px;font-size:2.5rem;margin-bottom:16px;">${member.avatar}</div>
        <h3>${member.name}</h3>
        <p style="color: var(--color-primary); margin: 8px 0;">${member.role}</p>
        <p style="color: var(--text-secondary); font-style: italic;">"${member.signature}"</p>
        <div class="member-skills" style="margin-top: 16px;">
          ${member.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      </div>
      <div style="text-align: center; margin-top: 16px;">
        <button class="btn btn-danger btn-sm" onclick="AboutModule.deleteMember('${id}')">删除成员</button>
      </div>
    `);
  },

  showAddModal() {
    App.showModal(`
      <div class="modal-header">
        <h3>➕ 添加新成员</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <form id="addMemberForm" onsubmit="AboutModule.handleAdd(event)">
        <div class="form-group">
          <label>头像 (Emoji)</label>
          <input type="text" id="memberAvatar" value="😊" maxlength="2" required>
        </div>
        <div class="form-group">
          <label>昵称</label>
          <input type="text" id="memberName" placeholder="输入昵称" required>
        </div>
        <div class="form-group">
          <label>角色</label>
          <input type="text" id="memberRole" placeholder="如：前端工程师">
        </div>
        <div class="form-group">
          <label>个人签名</label>
          <input type="text" id="memberSignature" placeholder="一句话介绍自己">
        </div>
        <div class="form-group">
          <label>技能标签 (逗号分隔)</label>
          <input type="text" id="memberSkills" placeholder="如：JavaScript, 设计, 美食">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">添加成员</button>
      </form>
    `);
  },

  handleAdd(e) {
    e.preventDefault();
    const newMember = {
      id: Storage.generateId(),
      avatar: document.getElementById('memberAvatar').value,
      name: document.getElementById('memberName').value,
      role: document.getElementById('memberRole').value || '成员',
      signature: document.getElementById('memberSignature').value || '暂无签名',
      skills: document.getElementById('memberSkills').value.split(',').map(s => s.trim()).filter(Boolean)
    };

    const members = this.getMembers();
    members.push(newMember);
    Storage.set(this.STORAGE_KEY, members);
    this.loadMembers();
    App.closeModal();
    App.toast('成员添加成功！', 'success');
  },

  deleteMember(id) {
    if (!confirm('确定要删除这位成员吗？')) return;
    const members = this.getMembers().filter(m => m.id !== id);
    Storage.set(this.STORAGE_KEY, members);
    this.loadMembers();
    App.closeModal();
    App.toast('成员已删除', 'info');
  }
};

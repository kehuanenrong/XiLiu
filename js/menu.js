/**
 * 菜谱分享模块
 */
const MenuModule = {
  STORAGE_KEY: 'xiliu_recipes',
  currentFilter: 'all',
  currentSearch: '',
  showAll: false,
  defaultShow: 7,

  defaultRecipes: [
    {
      id: '1',
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
      id: '2',
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
  ],

  init() {
    this.loadRecipes();
    document.getElementById('addRecipeBtn').addEventListener('click', () => this.showAddModal());
    document.getElementById('recipeSearch').addEventListener('input', (e) => {
      this.currentSearch = e.target.value.trim();
      this.showAll = false;
      this.renderRecipes();
    });
  },

  getRecipes() {
    return Storage.get(this.STORAGE_KEY, this.defaultRecipes);
  },

  filterByCat(cat) {
    this.currentFilter = cat;
    this.showAll = false;
    document.querySelectorAll('.recipe-filters .filter-tag').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === cat);
    });
    this.renderRecipes();
  },

  getFilteredRecipes() {
    let recipes = this.getRecipes();
    if (this.currentFilter !== 'all') {
      recipes = recipes.filter(r => r.category === this.currentFilter);
    }
    if (this.currentSearch) {
      recipes = recipes.filter(r => r.title.includes(this.currentSearch));
    }
    return recipes;
  },

  loadRecipes() {
    this.renderRecipes();
  },

  renderRecipes() {
    const filtered = this.getFilteredRecipes();
    const displayItems = this.showAll ? filtered : filtered.slice(0, this.defaultShow);
    const hasMore = filtered.length > this.defaultShow;

    const grid = document.getElementById('recipeGrid');
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🍽️</div>
          <p>${this.currentSearch ? '没有找到匹配的菜谱' : this.currentFilter !== 'all' ? `暂无「${this.currentFilter}」分类的菜谱` : '还没有菜谱，快来分享第一道菜吧'}</p>
        </div>
      `;
    } else {
      grid.innerHTML = displayItems.map((r, i) => this.renderCard(r, i)).join('');
    }

    // 展示更多 / 收起
    const moreEl = document.getElementById('recipeShowMore');
    if (hasMore) {
      moreEl.innerHTML = this.showAll
        ? `<button class="show-more-btn" onclick="MenuModule.toggleShowAll(false)">收起 ▲</button>`
        : `<button class="show-more-btn" onclick="MenuModule.toggleShowAll(true)">Show More ▼ <span>(${filtered.length - this.defaultShow} 个更多)</span></button>`;
    } else {
      moreEl.innerHTML = '';
    }
  },

  toggleShowAll(show) {
    this.showAll = show;
    this.renderRecipes();
  },

  renderCard(recipe, index) {
    const stars = '⭐'.repeat(recipe.difficulty) + '☆'.repeat(5 - recipe.difficulty);
    const imageHtml = recipe.image
      ? `<img src="${recipe.image}" style="width:100%;height:100%;object-fit:cover;">`
      : '🍳';
    const catTag = recipe.category ? `<span class="recipe-cat-tag">${recipe.category}</span>` : '';

    return `
      <div class="recipe-card" onclick="MenuModule.showDetail('${recipe.id}')">
        <div class="recipe-image">${imageHtml}</div>
        <div class="recipe-body">
          <div class="recipe-title">${recipe.title} ${catTag}</div>
          <div class="recipe-meta">
            <span class="recipe-difficulty">${stars}</span>
            <span>⏱️ ${recipe.time}</span>
          </div>
        </div>
      </div>
    `;
  },


  showDetail(id) {
    const recipe = this.getRecipes().find(r => r.id === id);
    if (!recipe) return;

    const stars = '⭐'.repeat(recipe.difficulty) + '☆'.repeat(5 - recipe.difficulty);
    const imageHtml = recipe.image
      ? `<img src="${recipe.image}" style="max-width:100%;border-radius:12px;margin-bottom:16px;">`
      : '';

    App.showModal(`
      <div class="modal-header">
        <h3>🍳 ${recipe.title}</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      ${imageHtml}
      <div style="display:flex;gap:16px;margin-bottom:16px;color:var(--text-secondary);flex-wrap:wrap;">
        <span>难度：${stars}</span>
        <span>⏱️ ${recipe.time}</span>
        ${recipe.category ? `<span>📂 ${recipe.category}</span>` : ''}
      </div>
      <h4>🥬 食材清单</h4>
      <ul style="margin:8px 0 16px 20px;">
        ${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}
      </ul>
      <h4>👨‍🍳 制作步骤</h4>
      <div class="step-list" style="margin:8px 0 16px 0;">
        ${recipe.steps.map((s, i) => `
          <div class="step-item">
            <span class="step-number">${i + 1}</span>
            <span>${s}</span>
          </div>
        `).join('')}
      </div>
      ${recipe.tips ? `
        <h4>💡 小贴士</h4>
        <p style="color:var(--text-secondary);margin-top:8px;">${recipe.tips}</p>
      ` : ''}
      <div style="text-align:center;margin-top:20px;">
        <button class="btn btn-danger btn-sm" onclick="MenuModule.delete('${id}')">删除菜谱</button>
      </div>
    `);
  },

  showAddModal() {
    App.showModal(`
      <div class="modal-header">
        <h3>📝 分享新菜谱</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <form id="addRecipeForm" onsubmit="MenuModule.handleAdd(event)">
        <div class="form-group">
          <label>菜名</label>
          <input type="text" id="recipeTitle" placeholder="如：红烧肉" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>分类</label>
            <select id="recipeCategory">
              <option value="家常菜">🥘 家常菜</option>
              <option value="烘焙">🍰 烘焙</option>
              <option value="饮品">🧋 饮品</option>
              <option value="小吃">🍡 小吃</option>
              <option value="硬菜">🥩 硬菜</option>
            </select>
          </div>
          <div class="form-group">
            <label>难度 (1-5)</label>
            <select id="recipeDifficulty">
              <option value="1">⭐ 入门</option>
              <option value="2">⭐⭐ 简单</option>
              <option value="3" selected>⭐⭐⭐ 中等</option>
              <option value="4">⭐⭐⭐⭐ 困难</option>
              <option value="5">⭐⭐⭐⭐⭐ 地狱</option>
            </select>
          </div>
          <div class="form-group">
            <label>烹饪时间</label>
            <input type="text" id="recipeTime" placeholder="如：30分钟">
          </div>
        </div>
        <div class="form-group">
          <label>成品图片</label>
          <input type="file" id="recipeImage" accept="image/*" onchange="MenuModule.handleImage(event)">
          <div id="recipeImagePreview" style="margin-top:8px;"></div>
        </div>
        <div class="form-group">
          <label>食材清单</label>
          <div id="ingredientList" class="ingredient-list">
            <div class="ingredient-item">
              <input type="text" placeholder="如：鸡蛋 2个">
              <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="MenuModule.addIngredient()" style="margin-top:8px;">➕ 添加食材</button>
        </div>
        <div class="form-group">
          <label>制作步骤</label>
          <div id="stepList" class="step-list">
            <div class="step-item">
              <span class="step-number">1</span>
              <textarea placeholder="第一步..." rows="2"></textarea>
              <button type="button" class="btn btn-sm btn-danger" onclick="MenuModule.removeStep(this)">✕</button>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="MenuModule.addStep()" style="margin-top:8px;">➕ 添加步骤</button>
        </div>
        <div class="form-group">
          <label>小贴士</label>
          <textarea id="recipeTips" placeholder="烹饪小窍门..." rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">发布菜谱</button>
      </form>
    `);
  },

  handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('recipeImagePreview').innerHTML = `
        <img src="${ev.target.result}" style="max-width:200px;border-radius:8px;">
      `;
      this._tempImage = ev.target.result;
    };
    reader.readAsDataURL(file);
  },

  addIngredient() {
    const list = document.getElementById('ingredientList');
    const item = document.createElement('div');
    item.className = 'ingredient-item';
    item.innerHTML = `
      <input type="text" placeholder="如：盐 适量">
      <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(item);
  },

  addStep() {
    const list = document.getElementById('stepList');
    const num = list.children.length + 1;
    const item = document.createElement('div');
    item.className = 'step-item';
    item.innerHTML = `
      <span class="step-number">${num}</span>
      <textarea placeholder="步骤${num}..." rows="2"></textarea>
      <button type="button" class="btn btn-sm btn-danger" onclick="MenuModule.removeStep(this)">✕</button>
    `;
    list.appendChild(item);
  },

  removeStep(btn) {
    const item = btn.parentElement;
    item.remove();
    const list = document.getElementById('stepList');
    list.querySelectorAll('.step-number').forEach((el, i) => { el.textContent = i + 1; });
  },

  handleAdd(e) {
    e.preventDefault();

    const ingredients = Array.from(document.querySelectorAll('#ingredientList input'))
      .map(input => input.value.trim()).filter(Boolean);
    const steps = Array.from(document.querySelectorAll('#stepList textarea'))
      .map(t => t.value.trim()).filter(Boolean);

    if (ingredients.length === 0) { App.toast('请至少添加一种食材', 'error'); return; }
    if (steps.length === 0) { App.toast('请至少添加一个步骤', 'error'); return; }

    const recipe = {
      id: Storage.generateId(),
      title: document.getElementById('recipeTitle').value,
      category: document.getElementById('recipeCategory').value,
      difficulty: parseInt(document.getElementById('recipeDifficulty').value),
      time: document.getElementById('recipeTime').value || '未知',
      image: this._tempImage || '',
      ingredients,
      steps,
      tips: document.getElementById('recipeTips').value,
      createdAt: new Date().toISOString()
    };

    const recipes = this.getRecipes();
    recipes.unshift(recipe);
    Storage.set(this.STORAGE_KEY, recipes);
    this._tempImage = '';
    this.loadRecipes();
    App.closeModal();
    App.toast('菜谱发布成功！🎉', 'success');
  },

  delete(id) {
    if (!confirm('确定要删除这个菜谱吗？')) return;
    const recipes = this.getRecipes().filter(r => r.id !== id);
    Storage.set(this.STORAGE_KEY, recipes);
    this.loadRecipes();
    App.closeModal();
    App.toast('菜谱已删除', 'info');
  }
};

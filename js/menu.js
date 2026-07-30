/**
 * 菜谱分享模块
 */
const MenuModule = {
  API_BASE: '/api/recipes',
  currentFilter: 'all',
  currentSearch: '',
  showAll: false,
  defaultShow: 7,
  recipesCache: [],

  init() {
    this.loadRecipes();
    document.getElementById('addRecipeBtn').addEventListener('click', () => this.showAddModal());
    document.getElementById('recipeSearch').addEventListener('input', (e) => {
      this.currentSearch = e.target.value.trim();
      this.showAll = false;
      this.renderRecipes();
    });
  },

  async fetchRecipes() {
    try {
      const res = await fetch(this.API_BASE);
      if (!res.ok) throw new Error('获取失败');
      const recipes = await res.json();
      this.recipesCache = recipes;
      return recipes;
    } catch (err) {
      console.error('获取菜谱失败:', err);
      App.toast('获取菜谱列表失败', 'error');
      return this.recipesCache;
    }
  },

  getRecipes() {
    return this.recipesCache;
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

  async loadRecipes() {
    await this.fetchRecipes();
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

  async handleAdd(e) {
    e.preventDefault();

    const ingredients = Array.from(document.querySelectorAll('#ingredientList input'))
      .map(input => input.value.trim()).filter(Boolean);
    const steps = Array.from(document.querySelectorAll('#stepList textarea'))
      .map(t => t.value.trim()).filter(Boolean);

    if (ingredients.length === 0) { App.toast('请至少添加一种食材', 'error'); return; }
    if (steps.length === 0) { App.toast('请至少添加一个步骤', 'error'); return; }

    const recipe = {
      title: document.getElementById('recipeTitle').value,
      category: document.getElementById('recipeCategory').value,
      difficulty: parseInt(document.getElementById('recipeDifficulty').value),
      time: document.getElementById('recipeTime').value || '未知',
      image: this._tempImage || '',
      ingredients,
      steps,
      tips: document.getElementById('recipeTips').value
    };

    try {
      const res = await fetch(this.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe)
      });
      if (!res.ok) throw new Error('添加失败');

      this._tempImage = '';
      await this.loadRecipes();
      App.closeModal();
      App.toast('菜谱发布成功！🎉', 'success');
    } catch (err) {
      console.error('添加菜谱失败:', err);
      App.toast('发布失败，请重试', 'error');
    }
  },

  async delete(id) {
    if (!confirm('确定要删除这个菜谱吗？')) return;
    try {
      const res = await fetch(`${this.API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');

      await this.loadRecipes();
      App.closeModal();
      App.toast('菜谱已删除', 'info');
    } catch (err) {
      console.error('删除菜谱失败:', err);
      App.toast('删除失败，请重试', 'error');
    }
  }
};

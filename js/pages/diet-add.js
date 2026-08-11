;(function () {
/* 饮食记录页 — 移植自小程序 pages/diet-add(搜索/份量/自定义/拍照/浮动底栏) */
const foods = __jianba('foods')
const dataStore = __jianba('data')
const photoStore = __jianba('photo-store')

Pages['diet-add'] = {
  title: '饮食记录',
  data: {
    searchQuery: '', searchResults: [],
    selectedItems: [], photoPath: '',
    servings: [], frequentFoods: [], customFoods: [],
    totalKcal: 0, recordTime: '', mealType: '',
    editTs: 0, isEdit: false, barExpanded: false
  },

  onLoad(params) {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, '0')
    const m = String(now.getMinutes()).padStart(2, '0')
    const recordTime = h + ':' + m

    this.data = { ...this.data, editTs: 0, isEdit: false, selectedItems: [], photoPath: '', recordTime, mealType: '', barExpanded: false, searchQuery: '', searchResults: [], servings: foods.COMMON_SERVINGS, frequentFoods: dataStore.getFrequentFoods(6), customFoods: dataStore.getCustomFoods() }
    if (params && params.ts) {
      const ts = parseInt(params.ts)
      const entry = dataStore.getAllDietEntries().find(e => e.ts === ts)
      if (entry) {
        this.data.editTs = ts
        this.data.isEdit = true
        this.data.selectedItems = entry.items
        this.data.photoPath = entry.photoPath || ''
        this.data.recordTime = entry.time || recordTime
        this.data.mealType = entry.mealType || ''
        this.data.totalKcal = entry.items.reduce((s, i) => s + i.kcal, 0)
        this.title = '编辑饮食记录'
      }
    }
  },

  render() {
    const s = this.data
    const mealChips = [['breakfast', '早餐'], ['lunch', '午餐'], ['dinner', '晚餐'], ['snack', '加餐']].map(([v, label]) => `
      <div class="meal-chip ${s.mealType === v ? 'active' : ''}" onclick="Pages['diet-add'].onMealTypeTap('${v}')">${label}</div>`).join('')

    const searchResults = s.searchResults.length > 0 ? `
    <view class="search-results">${s.searchResults.map(item => `
      <view class="food-result" onclick="Pages['diet-add'].onAddFood('${item.name}', ${item.kcal})">
        <div class="row">
          <div>
            <text class="food-name">${item.name}</text>
            <text class="muted">${item.kcal} kcal / ${item.unit}</text>
          </div>
          <text class="add-icon accent">+</text>
        </div>
      </view>`).join('')}</view>` : ''

    const photoHtml = s.photoPath
      ? `<div class="photo-preview">
           <img class="preview-img" id="diet-add-photo" data-path="${s.photoPath}" alt="记录照片" />
           <div class="photo-actions">
             <button class="btn-ghost small-btn" onclick="Pages['diet-add'].onTakePhoto()">重拍</button>
             <button class="btn-ghost small-btn danger" onclick="Pages['diet-add'].onRemovePhoto()">移除</button>
           </div>
         </div>`
      : `<div class="photo-area" onclick="Pages['diet-add'].onTakePhoto()">
           <text style="font-size:24px">📷</text>
           <text class="muted">点击拍照</text>
         </div>`

    const frequentHtml = s.frequentFoods.length > 0 ? `
    <div class="card">
      <text class="card-title">常用食物</text>
      <div class="serving-grid">${s.frequentFoods.map(f => `
        <div class="serving-chip" onclick="Pages['diet-add'].onAddFrequentFood('${f.name}', ${f.kcalPer100})">
          <text class="serving-name">${f.name}</text>
          <text class="serving-kcal accent">${f.kcalPer100} kcal/100g</text>
        </div>`).join('')}</div>
    </div>` : ''

    const customHtml = s.customFoods.length > 0 ? `
    <div class="card">
      <text class="card-title">我的自定义食物</text>
      <div class="serving-grid">${s.customFoods.map(f => `
        <div class="serving-chip custom-food-chip" onclick="Pages['diet-add'].onAddFrequentFood('${f.name}', ${f.kcalPer100})">
          <text class="serving-name">${f.name}</text>
          <text class="serving-kcal accent">${f.kcalPer100} kcal/100g</text>
          <text class="custom-food-del" onclick="event.stopPropagation();Pages['diet-add'].onRemoveCustomFood('${f.name}')">✕</text>
        </div>`).join('')}</div>
    </div>` : ''

    const servingHtml = s.servings.map((serving, i) => `
      <div class="serving-chip" onclick="Pages['diet-add'].onAddServing(${i})">
        <text class="serving-name">${serving.name}</text>
        <text class="serving-kcal accent">${serving.kcal} kcal</text>
      </div>`).join('')

    const panelHtml = `
    <div class="panel-backdrop ${s.barExpanded ? 'show' : ''}" onclick="Pages['diet-add'].onCollapseBar()"></div>
    <div class="panel ${s.barExpanded ? 'show' : ''}">
      <div class="panel-handle"></div>
      <div class="panel-header">
        <text class="panel-title">本次记录 (${s.selectedItems.length} 项)</text>
        <text class="panel-collapse" onclick="Pages['diet-add'].onCollapseBar()">收起</text>
      </div>
      <div class="panel-list">
        ${s.selectedItems.map((item, i) => `
        <div class="panel-item">
          <div class="panel-item-info">
            <text class="panel-item-name">${item.food}</text>
            <text class="panel-item-grams">${item.grams}g</text>
          </div>
          <div class="panel-item-right">
            <text class="panel-item-kcal">${item.kcal} kcal</text>
            <text class="panel-item-del" onclick="Pages['diet-add'].onRemoveItem(${i})">✕</text>
          </div>
        </div>`).join('')}
      </div>
      <div class="panel-footer">
        <div class="panel-total">
          <text class="panel-total-label">总计</text>
          <text class="panel-total-kcal">${s.totalKcal} kcal</text>
        </div>
        <div class="panel-save-btn" onclick="Pages['diet-add'].onSave()">保存记录</div>
      </div>
    </div>`

    return `
    <div class="container">
      <div class="card photo-card">
        <text class="card-title">拍照记录（可选）</text>
        ${photoHtml}
      </div>
      <div class="card">
        <div class="time-picker-row">
          <text class="time-picker-label">记录时间</text>
          <div class="time-picker-right">
            <input type="time" class="time-picker-val-input" value="${s.recordTime}" onchange="Pages['diet-add'].onTimeChange(this.value)" />
            <text class="time-picker-hint">时间不准？点击修改</text>
          </div>
        </div>
      </div>
      <div class="card">
        <text class="card-title">餐类</text>
        <div class="meal-type-row">${mealChips}</div>
      </div>
      <div class="card">
        <text class="card-title">搜索食物</text>
        <input class="search-input" placeholder="搜索食物名称..." value="${s.searchQuery}" oninput="Pages['diet-add'].onSearchInput(this.value)" onfocus="Pages['diet-add'].rememberFocus()" />
        ${searchResults}
      </div>
      ${frequentHtml}
      ${customHtml}
      <div class="card">
        <text class="card-title">常见份量（快速添加）</text>
        <div class="serving-grid">${servingHtml}</div>
      </div>
      <div class="card">
        <button class="btn-ghost custom-btn" onclick="Pages['diet-add'].onCustomFood()">+ 自定义食物（输入名称和热量）</button>
      </div>
      ${s.selectedItems.length > 0 ? '<div style="height:70px"></div>' : ''}
      ${s.selectedItems.length > 0 ? `
      <div class="float-bar">
        <div class="float-bar-summary" onclick="Pages['diet-add'].onToggleBar()">
          <text class="float-bar-icon">🛒</text>
          <text class="float-bar-text">已选 ${s.selectedItems.length} 项 · ${s.totalKcal} kcal</text>
          <text class="float-bar-arrow ${s.barExpanded ? 'up' : ''}">▸</text>
        </div>
        <div class="float-bar-save" onclick="Pages['diet-add'].onSave()">保存</div>
      </div>
      ${panelHtml}` : ''}
    </div>`
  },

  mount(root) {
    if (this._focusSearch) {
      this._focusSearch = false
      const el = root.querySelector('.search-input')
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    }
    const img = root.querySelector('img.preview-img')
    if (img) {
      photoStore.load(img.dataset.path).then(url => {
        if (url) img.src = url
        else img.style.display = 'none'
      }).catch(() => { img.style.display = 'none' })
    }
  },

  rememberFocus() { this._focusSearch = true },

  onMealTypeTap(v) { this.data.mealType = v; App.render() },
  onTimeChange(v) { this.data.recordTime = v },

  onSearchInput(v) {
    this.data.searchQuery = v
    this.data.searchResults = v.trim() ? foods.searchFoods(v) : []
    this._focusSearch = true
    App.render()
  },

  // 搜索结果添加 — 先问克数
  onAddFood(name, kcal) {
    ui.modal({
      title: '添加 ' + name,
      editable: true,
      placeholderText: '克数，默认 100g',
      content: '每100g 含 ' + kcal + ' kcal',
      confirmText: '确定'
    }).then(v => {
      if (v === null) return
      const grams = parseInt(v) || 100
      if (grams <= 0) { ui.toast('请输入有效克数'); return }
      this.addItem({ food: name, grams, kcal: foods.calcFoodCalories(kcal, grams) })
    })
  },

  onAddServing(i) {
    const s = this.data.servings[i]
    if (!s) return
    this.addItem({ food: s.food, grams: s.grams, kcal: s.kcal })
  },

  onAddFrequentFood(name, kcalPer100) {
    this.addItem({ food: name, grams: 100, kcal: foods.calcFoodCalories(kcalPer100, 100) })
  },

  // 自定义食物 — 两级弹窗:名称 → 「热量,克数」
  onCustomFood() {
    ui.modal({ title: '自定义食物', editable: true, placeholderText: '食物名称' }).then(res => {
      if (!res || !res.trim()) return
      const name = res.trim()
      ui.modal({
        title: '热量与克数',
        editable: true,
        placeholderText: '如 320, 150',
        content: '每100g 热量 kcal, 克数（克数可不填，默认 100g）'
      }).then(res2 => {
        if (!res2 || !res2.trim()) return
        const parts = String(res2).split(/[,，\s]+/).filter(Boolean)
        const kcalPer100 = parseInt(parts[0])
        const grams = parts[1] !== undefined ? parseInt(parts[1]) : 100
        if (!kcalPer100 || kcalPer100 <= 0) { ui.toast('请输入有效热量值'); return }
        if (!grams || grams <= 0) { ui.toast('请输入有效克数'); return }
        dataStore.addCustomFood(name, kcalPer100)
        this.data.customFoods = dataStore.getCustomFoods()
        const kcal = Math.round(kcalPer100 * grams / 100)
        this.addItem({ food: name, grams, kcal })
      })
    })
  },

  addItem(item) {
    this.data.selectedItems = [...this.data.selectedItems, item]
    this.data.totalKcal = this.data.selectedItems.reduce((s, i) => s + i.kcal, 0)
    ui.vibrate()
    App.render()
  },

  onRemoveItem(i) {
    this.data.selectedItems = this.data.selectedItems.filter((_, idx) => idx !== i)
    this.data.totalKcal = this.data.selectedItems.reduce((s, it) => s + it.kcal, 0)
    if (this.data.selectedItems.length === 0) this.data.barExpanded = false
    App.render()
  },

  onToggleBar() {
    if (this.data.selectedItems.length === 0) return
    this.data.barExpanded = !this.data.barExpanded
    App.render()
  },
  onCollapseBar() { this.data.barExpanded = false; App.render() },

  onRemoveCustomFood(name) {
    ui.confirm({
      title: '删除自定义食物',
      content: `确定删除「${name}」吗？`,
      onConfirm: () => {
        dataStore.removeCustomFood(name)
        this.data.customFoods = dataStore.getCustomFoods()
        App.render()
        ui.toast('已删除')
      }
    })
  },

  // === 拍照 ===
  onTakePhoto() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files[0]
      if (!file) return
      try {
        const dataURL = await photoStore.compressImage(file, 800)
        const path = '/photos/' + Date.now() + '.jpg'
        await photoStore.save(path, dataURL)
        const oldPath = this.data.photoPath
        if (oldPath) dataStore.deletePhotoFile(oldPath) // 换新照片,清掉旧图
        this.data.photoPath = path
        App.render()
        ui.toast('照片已添加')
      } catch (e) { ui.toast('照片保存失败，请重试') }
    }
    input.click()
  },

  onRemovePhoto() {
    dataStore.deletePhotoFile(this.data.photoPath)
    this.data.photoPath = ''
    App.render()
  },

  // === 保存 ===
  onSave() {
    if (this._saving) return
    if (this.data.selectedItems.length === 0) { ui.toast('请添加至少一种食物'); return }
    this._saving = true
    if (this.data.isEdit) {
      dataStore.updateDietEntryFull(this.data.editTs, this.data.selectedItems, this.data.photoPath, this.data.recordTime, this.data.mealType)
      ui.toast('记录已更新')
    } else {
      const result = dataStore.addDietEntry(this.data.selectedItems, this.data.photoPath, this.data.recordTime, this.data.mealType)
      ui.toast(`已记录 ${result.totalKcal} kcal`)
    }
    setTimeout(() => App.back(), 900)
  }
}

})();

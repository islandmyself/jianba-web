/* 训练记录页 — 移植自小程序 pages/training-record(含自定义动作) */
const calc = __jianba('calc')
const dataStore = __jianba('data')

Pages['training-record'] = {
  title: '训练记录',
  data: {
    categories: [], activeCat: '', selectedKey: '', selectedName: '', selectedMet: 0,
    weight: '20', reps: '12', sets: '3',
    exerciseList: [], totalKcal: 0,
    recordTime: '', editTs: 0, isEdit: false,
    showCustomForm: false, customName: '', customCat: '', customIntensity: 'medium',
    customExercises: {}
  },

  onLoad(params) {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, '0')
    const m = String(now.getMinutes()).padStart(2, '0')
    const recordTime = h + ':' + m

    this.data = { ...this.data, editTs: 0, isEdit: false, exerciseList: [], recordTime, showCustomForm: false, customName: '', selectedKey: '', selectedName: '', selectedMet: 0 }
    if (params && params.ts) {
      const ts = parseInt(params.ts)
      const entry = dataStore.getAllTrainings().find(t => t.ts === ts)
      if (entry) {
        this.data.editTs = ts
        this.data.isEdit = true
        this.data.exerciseList = entry.exercises
        this.data.recordTime = entry.time || recordTime
        this.data.totalKcal = entry.totalKcal
        this.title = '编辑训练记录'
      }
    }
    this.buildCategories()
  },

  buildCategories() {
    const custom = dataStore.getCustomExercises()
    const cats = Object.keys(calc.EXERCISE_CATEGORIES).map(k => {
      const cat = calc.EXERCISE_CATEGORIES[k]
      const defaultEx = cat.keys.map(ek => ({ key: ek, name: calc.EXERCISE_NAMES[ek] || ek, met: calc.EXERCISE_MET[ek] || 5, custom: false }))
      const customEx = (custom[k] || []).map(e => ({ key: e.key, name: e.name, met: e.met, custom: true }))
      return { key: k, label: cat.label, exercises: [...defaultEx, ...customEx] }
    })
    this.data.categories = cats
    if (!this.data.activeCat || !cats.some(c => c.key === this.data.activeCat)) this.data.activeCat = cats[0]?.key || ''
  },

  render() {
    const s = this.data
    const activeCat = s.categories.find(c => c.key === s.activeCat)
    const exercises = activeCat ? activeCat.exercises : []
    const catTabs = s.categories.map(c => `
      <div class="cat-tab ${s.activeCat === c.key ? 'active' : ''}" onclick="Pages['training-record'].onCatTap('${c.key}')">${c.label}</div>`).join('')
    const exGrid = exercises.map(ex => `
      <div class="ex-opt ${s.selectedKey === ex.key ? 'selected' : ''} ${ex.custom ? 'custom-ex' : ''}" onclick="Pages['training-record'].onExTap('${ex.key}','${ex.name}',${ex.met})">
        ${ex.name}${ex.custom ? `<text class="ex-del" onclick="event.stopPropagation();Pages['training-record'].onRemoveCustomExercise('${activeCat.key}','${ex.key}')">✕</text>` : ''}
      </div>`).join('')

    const detailCard = s.selectedKey ? `
    <div class="card">
      <text class="card-title">${s.selectedName} 详情</text>
      <div class="time-row">
        <input type="time" class="time-picker" value="${s.recordTime}" onchange="Pages['training-record'].onTimeChange(this.value)" />
      </div>
      <div class="form-row">
        <div class="form-item">
          <text class="form-label muted">重量 (kg)</text>
          <input class="form-input" type="number" inputmode="decimal" value="${s.weight}" oninput="Pages['training-record'].onFieldInput('weight', this.value)" onfocus="Pages['training-record'].rememberFocus('weight')" />
        </div>
        <div class="form-item">
          <text class="form-label muted">次数</text>
          <input class="form-input" type="number" inputmode="numeric" value="${s.reps}" oninput="Pages['training-record'].onFieldInput('reps', this.value)" onfocus="Pages['training-record'].rememberFocus('reps')" />
        </div>
        <div class="form-item">
          <text class="form-label muted">组数</text>
          <input class="form-input" type="number" inputmode="numeric" value="${s.sets}" oninput="Pages['training-record'].onFieldInput('sets', this.value)" onfocus="Pages['training-record'].rememberFocus('sets')" />
        </div>
      </div>
      <button class="btn-primary add-ex-btn" onclick="Pages['training-record'].onAddExercise()">添加此动作</button>
    </div>` : ''

    const customForm = s.showCustomForm ? `
    <div class="card">
      <text class="card-title">添加自定义动作</text>
      <div class="form-group">
        <text class="form-label muted">动作名称</text>
        <input class="form-input" placeholder="例如：哑铃飞鸟" value="${s.customName}" oninput="Pages['training-record'].onCustomNameInput(this.value)" />
      </div>
      <div class="form-group">
        <text class="form-label muted">所属部位</text>
        <div class="cat-scroll">${s.categories.map(c => `
          <div class="cat-tab small ${s.customCat === c.key ? 'active' : ''}" onclick="Pages['training-record'].onCustomCatTap('${c.key}')">${c.label}</div>`).join('')}</div>
      </div>
      <div class="form-group">
        <text class="form-label muted">强度</text>
        <div class="intensity-row">
          <div class="opt-chip ${s.customIntensity === 'low' ? 'active' : ''}" onclick="Pages['training-record'].onIntensityTap('low')">低强度 (MET 3)</div>
          <div class="opt-chip ${s.customIntensity === 'medium' ? 'active' : ''}" onclick="Pages['training-record'].onIntensityTap('medium')">中强度 (MET 5)</div>
          <div class="opt-chip ${s.customIntensity === 'high' ? 'active' : ''}" onclick="Pages['training-record'].onIntensityTap('high')">高强度 (MET 8)</div>
        </div>
      </div>
      <button class="btn-primary" onclick="Pages['training-record'].onAddCustomExercise()">添加动作</button>
    </div>` : ''

    const listCard = s.exerciseList.length > 0 ? `
    <div class="card">
      <text class="card-title">本次训练 (${s.exerciseList.length} 个动作)</text>
      ${s.exerciseList.map((item, i) => `
      <div class="added-ex">
        <div class="row">
          <div>
            <text class="added-name">${item.name}</text>
            <text class="muted">${item.weight}kg · ${item.reps}次 × ${item.sets}组</text>
          </div>
          <div class="right-col">
            <text class="accent">${item.kcal} kcal</text>
            <text class="remove-icon" onclick="Pages['training-record'].onRemoveEx(${i})">✕</text>
          </div>
        </div>
        ${i < s.exerciseList.length - 1 ? '<div class="divider"></div>' : ''}
      </div>`).join('')}
      <div class="divider"></div>
      <div class="row">
        <text class="total-label">预估总消耗</text>
        <text class="total-kcal accent">${s.totalKcal} kcal</text>
      </div>
    </div>` : ''

    return `
    <div class="container">
      <div class="cat-scroll">${catTabs}</div>
      <div class="card">
        <text class="card-title">选择动作</text>
        <div class="ex-grid">${exGrid}</div>
        <button class="btn-ghost add-custom-btn" onclick="Pages['training-record'].onToggleCustomForm()">${s.showCustomForm ? '收起' : '+ 添加自定义动作'}</button>
      </div>
      ${customForm}
      ${detailCard}
      ${listCard}
      ${s.exerciseList.length > 0 ? `<button class="btn-primary save-btn" onclick="Pages['training-record'].onSave()">保存训练记录</button>` : ''}
    </div>`
  },

  mount(root) {
    // 输入后重渲染恢复焦点
    const f = this._focusField
    if (f) {
      this._focusField = ''
      const el = root.querySelector('.form-input')
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    }
  },

  rememberFocus(field) { this._focusField = field },
  onFieldInput(field, v) { this.data[field] = v; this._focusField = field; App.render() },

  onCatTap(key) { this.data.activeCat = key; this.data.selectedKey = ''; this.data.selectedName = ''; App.render() },
  onExTap(key, name, met) { this.data.selectedKey = key; this.data.selectedName = name; this.data.selectedMet = Number(met) || 0; App.render() },

  onTimeChange(v) { this.data.recordTime = v },

  updateTotalKcal(list) {
    this.data.exerciseList = list
    this.data.totalKcal = list.reduce((s, e) => s + e.kcal, 0)
  },

  onAddExercise() {
    const { selectedKey, selectedName, selectedMet, weight, reps, sets } = this.data
    const w = parseFloat(weight) || 0
    const r = parseInt(reps) || 0
    const s = parseInt(sets) || 0
    if (!selectedKey) { ui.toast('请选择动作'); return }
    if (w <= 0 || r <= 0 || s <= 0) { ui.toast('请填写完整数据'); return }
    const profile = dataStore.getProfile()
    const kcal = calc.calcExerciseCalories(selectedKey, profile.weightKg, s, r, selectedMet || undefined)
    const list = [...this.data.exerciseList, { key: selectedKey, name: selectedName, weight: w, reps: r, sets: s, kcal, met: selectedMet || undefined }]
    this.updateTotalKcal(list)
    this.data.selectedKey = ''; this.data.selectedName = ''; this.data.selectedMet = 0
    ui.vibrate()
    App.render()
  },

  onRemoveEx(i) {
    this.updateTotalKcal(this.data.exerciseList.filter((_, idx) => idx !== i))
    App.render()
  },

  onSave() {
    if (this._saving) return
    if (this.data.exerciseList.length === 0) { ui.toast('请添加至少一个动作'); return }
    this._saving = true
    if (this.data.isEdit) {
      dataStore.updateTrainingEntry(this.data.editTs, this.data.exerciseList, this.data.recordTime)
      ui.toast('训练记录已更新')
    } else {
      const result = dataStore.addTraining(this.data.exerciseList, this.data.recordTime)
      ui.toast(`已记录！消耗 ${result.totalKcal} kcal`)
    }
    setTimeout(() => App.back(), 900)
  },

  // === 自定义动作 ===
  onToggleCustomForm() {
    this.data.showCustomForm = !this.data.showCustomForm
    this.data.customCat = this.data.activeCat
    App.render()
  },
  onCustomNameInput(v) { this.data.customName = v },
  onCustomCatTap(key) { this.data.customCat = key; App.render() },
  onIntensityTap(v) { this.data.customIntensity = v; App.render() },

  onAddCustomExercise() {
    const { customName, customCat, customIntensity } = this.data
    if (!customName.trim()) { ui.toast('请输入动作名称'); return }
    const metMap = { low: 3, medium: 5, high: 8 }
    const met = metMap[customIntensity] || 5
    const key = dataStore.addCustomExercise(customCat, customName.trim(), met)
    if (key) {
      ui.toast('动作已添加')
      this.data.showCustomForm = false
      this.data.customName = ''
      this.buildCategories()
      this.data.activeCat = customCat
      App.render()
    }
  },

  onRemoveCustomExercise(cat, key) {
    ui.confirm({
      title: '删除自定义动作',
      content: '确定删除这个动作吗？',
      onConfirm: () => {
        dataStore.removeCustomExercise(cat, key)
        this.buildCategories()
        App.render()
        ui.toast('已删除')
      }
    })
  }
}

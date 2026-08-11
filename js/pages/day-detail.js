;(function () {
/* 某日详情 — 移植自小程序 pages/day-detail(hero 滚动缩放、睡眠/训练/饮食行内编辑) */
const calc = __jianba('calc')
const dataStore = __jianba('data')

Pages['day-detail'] = {
  title: '日详情',
  data: { date: '', summary: null, sleepData: null, trainingLogs: [], dietLogs: [], editingTs: 0, editType: '', editForms: {}, heroScale: 1 },

  onLoad(params) {
    this.data.date = params.date || ''
    this.title = this.data.date ? this.data.date + ' 详情' : '日详情'
    this.refresh()
  },

  refresh() {
    const date = this.data.date
    const profile = dataStore.getProfile()
    const trainingLogs = dataStore.getTrainingsByDate(date)
    const dietLogs = dataStore.getDietByDate(date)
    const record = dataStore.getRecordByDate(date)
    const sleepData = record.sleep || null

    const weightKg = dataStore.getWeightOnDate(date) || profile.weightKg
    const bmr = calc.calcBMR(profile.gender, weightKg, profile.heightCm, profile.age)
    const stepKcal = calc.calcStepCalories(record.steps || 0, weightKg)
    const totalOut = calc.calcTDEE(bmr, profile.activityLevel) + (record.trainingKcal || 0) + stepKcal
    const totalIn = record.dietKcal || 0
    const scoreData = dataStore.getScoreForDate(date)
    this.data.summary = {
      bmr, stepKcal, totalOut, totalIn, deficit: totalOut - totalIn, steps: record.steps || 0,
      score: scoreData.totalScore, userType: scoreData.userType
    }
    this._scoreData = scoreData
    this.data.sleepData = sleepData
    this.data.trainingLogs = trainingLogs
    this.data.dietLogs = dietLogs
    this.data.editingTs = 0
    this.data.editType = ''
    this.data.editForms = {}
  },

  render() {
    const s = this.data
    const sc = this.data.heroScale

    const sleepCard = `
    <div class="card">
      ${s.editingTs === -1 && s.editType === 'sleep' ? '' : `
      <div class="row">
        <div>
          <text class="item-title">😴 睡眠</text>
          ${s.sleepData ? `<text class="item-time muted">${s.sleepData.durationHours}h${(s.sleepData.bedTime || s.sleepData.wakeTime) ? '  ' + (s.sleepData.bedTime || '') + (s.sleepData.bedTime && s.sleepData.wakeTime ? '~' : '') + (s.sleepData.wakeTime || '') : ''}</text>` : ''}
        </div>
        <div class="action-row">
          <text class="edit-btn" onclick="Pages['day-detail'].onEditSleep()">编辑</text>
          ${s.sleepData ? `<text class="delete-btn" onclick="Pages['day-detail'].onDeleteSleep()">删除</text>` : ''}
        </div>
      </div>`}
      ${s.editingTs === -1 && s.editType === 'sleep' ? `
      <div class="form-row-3">
        <div class="form-item">
          <text class="form-label">时长（小时）</text>
          <input class="form-input" type="number" inputmode="decimal" value="${s.editForms.s_dur || ''}" placeholder="如 7.5" oninput="Pages['day-detail'].onEditFieldChange('s_dur', this.value)" />
        </div>
        <div class="form-item">
          <text class="form-label">入睡时间</text>
          <input class="form-input" value="${s.editForms.s_bed || ''}" placeholder="如 23:30" oninput="Pages['day-detail'].onEditFieldChange('s_bed', this.value)" />
        </div>
        <div class="form-item">
          <text class="form-label">醒来时间</text>
          <input class="form-input" value="${s.editForms.s_wake || ''}" placeholder="如 07:00" oninput="Pages['day-detail'].onEditFieldChange('s_wake', this.value)" />
        </div>
      </div>
      <div class="row" style="justify-content:flex-end;gap:10px;margin-top:8px">
        <text class="save-btn-text" onclick="Pages['day-detail'].onSaveEdit()">保存</text>
        <text class="cancel-btn-text" onclick="Pages['day-detail'].onCancelEdit()">取消</text>
      </div>` : ''}
    </div>`

    const trainingCards = s.trainingLogs.length === 0
      ? `<div class="card empty-card"><text class="muted">当天无训练记录</text></div>`
      : s.trainingLogs.map(log => {
          const isEditing = s.editingTs === log.ts && s.editType === 'training'
          return `
          <div class="card">
            <div class="row">
              <div>
                <text class="item-title">训练 · ${log.totalKcal} kcal</text>
                ${log.time ? `<text class="item-time muted">${log.time}</text>` : ''}
              </div>
              <div class="action-row">
                ${isEditing
                  ? `<text class="save-btn-text" onclick="Pages['day-detail'].onSaveEdit()">保存</text><text class="cancel-btn-text" onclick="Pages['day-detail'].onCancelEdit()">取消</text>`
                  : `<text class="edit-btn" onclick="Pages['day-detail'].onEditTraining(${log.ts})">编辑</text><text class="delete-btn" onclick="Pages['day-detail'].onDeleteTraining(${log.ts})">删除</text>`}
              </div>
            </div>
            ${isEditing
              ? log.exercises.map((ex, i) => `
                <div class="edit-exercise">
                  <text class="edit-ex-name">${ex.name}</text>
                  <div class="form-row-3">
                    <div class="form-item"><text class="form-label">重量 kg</text><input class="form-input" type="number" inputmode="decimal" value="${s.editForms['w_' + i] || ''}" oninput="Pages['day-detail'].onEditFieldChange('w_${i}', this.value)" /></div>
                    <div class="form-item"><text class="form-label">次数</text><input class="form-input" type="number" inputmode="numeric" value="${s.editForms['r_' + i] || ''}" oninput="Pages['day-detail'].onEditFieldChange('r_${i}', this.value)" /></div>
                    <div class="form-item"><text class="form-label">组数</text><input class="form-input" type="number" inputmode="numeric" value="${s.editForms['s_' + i] || ''}" oninput="Pages['day-detail'].onEditFieldChange('s_${i}', this.value)" /></div>
                  </div>
                  ${i < log.exercises.length - 1 ? '<div class="divider"></div>' : ''}
                </div>`).join('')
              : `<div class="ex-list">${log.exercises.map(ex => `<text class="ex-tag">${ex.name} ${ex.weight}kg×${ex.reps}×${ex.sets}</text>`).join('')}</div>`}
          </div>`
        }).join('')

    const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
    const dietCards = s.dietLogs.length === 0
      ? `<div class="card empty-card"><text class="muted">当天无饮食记录</text></div>`
      : s.dietLogs.map(log => {
          const isEditing = s.editingTs === log.ts && s.editType === 'diet'
          return `
          <div class="card">
            <div class="row">
              <div>
                <text class="item-title">${mealLabels[log.mealType] || '饮食'} · ${log.totalKcal} kcal</text>
                ${log.time ? `<text class="item-time muted">${log.time}</text>` : ''}
              </div>
              <div class="action-row">
                ${isEditing
                  ? `<text class="save-btn-text" onclick="Pages['day-detail'].onSaveEdit()">保存</text><text class="cancel-btn-text" onclick="Pages['day-detail'].onCancelEdit()">取消</text>`
                  : `<text class="edit-btn" onclick="Pages['day-detail'].onEditDiet(${log.ts})">编辑</text><text class="delete-btn" onclick="Pages['day-detail'].onDeleteDiet(${log.ts})">删除</text>`}
              </div>
            </div>
            ${isEditing
              ? log.items.map((item, i) => `
                <div class="edit-exercise">
                  <div class="form-row-3">
                    <div class="form-item"><text class="form-label">食物</text><input class="form-input" value="${s.editForms['food_' + i] || ''}" oninput="Pages['day-detail'].onEditFieldChange('food_${i}', this.value)" /></div>
                    <div class="form-item"><text class="form-label">克数</text><input class="form-input" type="number" inputmode="numeric" value="${s.editForms['grams_' + i] || ''}" oninput="Pages['day-detail'].onEditFieldChange('grams_${i}', this.value)" /></div>
                    <div class="form-item"><text class="form-label">kcal</text><input class="form-input" type="number" inputmode="numeric" value="${s.editForms['kcal_' + i] || ''}" oninput="Pages['day-detail'].onEditFieldChange('kcal_${i}', this.value)" /></div>
                  </div>
                  ${i < log.items.length - 1 ? '<div class="divider"></div>' : ''}
                </div>`).join('')
              : `<div class="food-list">${log.items.map(item => `<text class="food-tag">${item.food} ${item.grams}g (${item.kcal}kcal)</text>`).join('')}</div>`}
          </div>`
        }).join('')

    return `
    <div class="container">
      <div class="hero" id="day-hero" style="min-height:${Math.max(35, sc * 100)}vh;padding-top:20px">
        <text class="hero-date">${s.date}</text>
        <div class="hero-main">
          <div class="hero-item hero-score" style="cursor:pointer" onclick="Pages['day-detail'].onScoreTap()">
            <text class="hero-big-num" id="day-score-num" style="font-size:${sc * 60}px">${s.summary ? s.summary.score : '-'}</text>
            <text class="hero-label" id="day-score-label" style="font-size:${sc * 14}px">每日评分 ›</text>
          </div>
          <div class="hero-divider" id="day-hero-divider" style="height:${sc * 80}px"></div>
          <div class="hero-item hero-deficit">
            <text class="hero-big-num ${s.summary && s.summary.deficit > 0 ? 'deficit-green' : 'deficit-red'}" id="day-deficit-num" style="font-size:${sc * 60}px">${s.summary ? (s.summary.deficit > 0 ? '-' : '+') + s.summary.deficit : '-'}</text>
            <text class="hero-label" id="day-deficit-label" style="font-size:${sc * 14}px">${s.summary ? (s.summary.deficit > 0 ? '热量缺口' : '热量盈余') + ' kcal' : ''}</text>
          </div>
        </div>
        <div class="hero-sub" id="day-hero-sub" style="font-size:${sc * 13}px">
          <text class="hero-sub-item">消耗 ${s.summary ? s.summary.totalOut : 0}</text>
          <text class="hero-sub-item">摄入 ${s.summary ? s.summary.totalIn : 0}</text>
          <text class="hero-sub-item">步数 ${s.summary ? s.summary.steps : 0}</text>
        </div>
        <div class="scroll-hint" id="day-scroll-hint" style="opacity:${sc > 0.7 ? 1 : 0}">
          <text class="scroll-hint-text">下滑查看当日详细数据</text>
          <text class="scroll-hint-arrow">↓</text>
        </div>
      </div>

      <div class="section-title">睡眠记录</div>
      ${!s.sleepData && s.editingTs !== -1 ? `<div class="card empty-card"><text class="muted">当天无睡眠记录</text></div>` : ''}
      ${sleepCard}

      <div class="section-title">训练记录</div>
      ${trainingCards}

      <div class="section-title">饮食记录</div>
      ${dietCards}
    </div>`
  },

  mount(root) {
    if (!this._scrollBound) {
      this._scrollBound = true
      window.addEventListener('scroll', () => {
        if (App.current().path !== '/day-detail') return
        const scale = Math.max(0.3, 1 - window.scrollY / 220)
        const rounded = Math.round(scale * 100) / 100
        if (Math.abs(rounded - this.data.heroScale) > 0.01) {
          this.data.heroScale = rounded
          const el = (id) => document.getElementById(id)
          const hero = el('day-hero')
          if (hero) {
            hero.style.minHeight = Math.max(35, rounded * 100) + 'vh'
            el('day-score-num').style.fontSize = rounded * 60 + 'px'
            el('day-score-label').style.fontSize = rounded * 14 + 'px'
            el('day-hero-divider').style.height = rounded * 80 + 'px'
            el('day-deficit-num').style.fontSize = rounded * 60 + 'px'
            el('day-deficit-label').style.fontSize = rounded * 14 + 'px'
            el('day-hero-sub').style.fontSize = rounded * 13 + 'px'
            el('day-scroll-hint').style.opacity = rounded > 0.7 ? 1 : 0
          }
        }
      })
    }
  },

  // === Sleep ===
  onEditSleep() {
    const s = this.data.sleepData || { durationHours: '', bedTime: '', wakeTime: '' }
    this.data.editingTs = -1
    this.data.editType = 'sleep'
    this.data.editForms = {
      s_dur: String(s.durationHours != null ? s.durationHours : ''),
      s_bed: s.bedTime || '',
      s_wake: s.wakeTime || ''
    }
    App.render()
  },

  onDeleteSleep() {
    ui.confirm({
      title: '删除睡眠记录',
      content: '确定删除这天的睡眠记录吗？',
      onConfirm: () => {
        dataStore.deleteSleep(this.data.date)
        this.refresh()
        App.render()
        ui.toast('已删除')
      }
    })
  },

  // === Training ===
  onDeleteTraining(ts) {
    ui.confirm({
      title: '删除训练记录',
      content: '确定删除这条训练记录吗？',
      onConfirm: () => {
        dataStore.deleteTrainingEntry(Number(ts))
        this.refresh()
        App.render()
        ui.toast('已删除')
      }
    })
  },

  onEditTraining(ts) {
    const log = this.data.trainingLogs.find(t => t.ts === ts)
    if (!log) return
    const forms = {}
    log.exercises.forEach((ex, i) => {
      forms['w_' + i] = String(ex.weight)
      forms['r_' + i] = String(ex.reps)
      forms['s_' + i] = String(ex.sets)
    })
    this.data.editingTs = ts
    this.data.editType = 'training'
    this.data.editForms = forms
    App.render()
  },

  // === Diet ===
  onEditDiet(ts) {
    const log = this.data.dietLogs.find(d => d.ts === ts)
    if (!log) return
    const forms = {}
    log.items.forEach((item, i) => {
      forms['food_' + i] = item.food
      forms['grams_' + i] = String(item.grams)
      forms['kcal_' + i] = String(item.kcal)
    })
    this.data.editingTs = ts
    this.data.editType = 'diet'
    this.data.editForms = forms
    App.render()
  },

  onEditFieldChange(field, v) {
    this.data.editForms = { ...this.data.editForms, [field]: v }
  },

  onSaveEdit() {
    const ts = this.data.editingTs
    const editType = this.data.editType
    const forms = this.data.editForms

    if (editType === 'sleep') {
      const dur = parseFloat(forms.s_dur)
      if (isNaN(dur) || dur < 0.5 || dur > 16) { ui.toast('请输入有效时长（0.5-16h）'); return }
      if (forms.s_bed && !/^\d{1,2}:\d{2}$/.test(forms.s_bed)) { ui.toast('入睡时间格式不对，如 23:30'); return }
      if (forms.s_wake && !/^\d{1,2}:\d{2}$/.test(forms.s_wake)) { ui.toast('醒来时间格式不对，如 07:00'); return }
      dataStore.updateSleep(this.data.date, {
        durationHours: dur,
        bedTime: forms.s_bed || '',
        wakeTime: forms.s_wake || ''
      })
      ui.toast('已更新')
      this.refresh()
      App.render()
      return
    }

    if (editType === 'training') {
      const log = this.data.trainingLogs.find(t => t.ts === ts)
      if (!log) return
      for (let i = 0; i < log.exercises.length; i++) {
        const w = parseFloat(forms['w_' + i]) || 0
        const r = parseInt(forms['r_' + i]) || 0
        const s = parseInt(forms['s_' + i]) || 0
        if (w <= 0 || r <= 0 || s <= 0) { ui.toast('请填写完整的训练数据'); return }
        dataStore.updateTrainingExercise(ts, i, { weight: w, reps: r, sets: s })
      }
    } else if (editType === 'diet') {
      const log = this.data.dietLogs.find(d => d.ts === ts)
      if (!log) return
      const items = log.items.map((item, i) => ({
        food: forms['food_' + i] || item.food,
        grams: parseInt(forms['grams_' + i]) || 0,
        kcal: parseInt(forms['kcal_' + i]) || 0
      }))
      if (items.some(it => !it.food || it.grams <= 0 || it.kcal <= 0)) { ui.toast('请填写完整的饮食数据'); return }
      dataStore.updateDietEntry(ts, items)
    }
    ui.toast('已更新')
    this.refresh()
    App.render()
  },

  onCancelEdit() {
    this.data.editingTs = 0
    this.data.editType = ''
    this.data.editForms = {}
    App.render()
  },

  onScoreTap() { App.go('/score-detail?date=' + this.data.date) },

  onDeleteDiet(ts) {
    ui.confirm({
      title: '删除饮食记录',
      content: '确定删除这条饮食记录吗？',
      onConfirm: () => {
        dataStore.deleteDietEntry(Number(ts))
        this.refresh()
        App.render()
        ui.toast('已删除')
      }
    })
  }
}

})();

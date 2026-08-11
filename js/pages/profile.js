;(function () {
/* 我的 tab — 移植自小程序 pages/profile */
const dataStore = __jianba('data')

Pages['profile'] = {
  title: '我的',
  tab: true,
  data: { profile: {}, summary: {}, weightHistory: [], editing: false, editForm: {} },

  onLoad() {
    this.refresh()
  },

  refresh() {
    this.data.profile = dataStore.getProfile()
    this.data.summary = dataStore.getDailySummary()
    this.data.weightHistory = dataStore.getWeightHistory().slice().reverse()
  },

  onEdit() {
    this.data.editing = true
    this.data.editForm = { ...this.data.profile }
    App.render()
  },

  onCancelEdit() {
    this.data.editing = false
    App.render()
  },

  onFieldChange(field, v) {
    let value = v
    if (field === 'heightCm' || field === 'weightKg' || field === 'age') {
      value = v === '' ? '' : Number(v)
    }
    this.data.editForm = { ...this.data.editForm, [field]: value }
  },

  onGenderTap(v) { this.data.editForm = { ...this.data.editForm, gender: v }; App.render() },
  onOptTap(field, v) { this.data.editForm = { ...this.data.editForm, [field]: v }; App.render() },

  onSaveProfile() {
    const form = this.data.editForm
    if (!form.heightCm || !form.weightKg || !form.age) { ui.toast('请填写完整身体数据'); return }
    if (form.heightCm < 100 || form.heightCm > 250) { ui.toast('身高范围 100-250 cm'); return }
    if (form.weightKg < 30 || form.weightKg > 250) { ui.toast('体重范围 30-250 kg'); return }
    if (form.age < 10 || form.age > 120) { ui.toast('年龄范围 10-120 岁'); return }
    dataStore.setProfile(form)
    this.data.editing = false
    this.refresh()
    App.render()
    ui.toast('资料已更新')
  },

  onExport() {
    const json = JSON.stringify(dataStore.load(), null, 2)
    const copy = () => {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(json)
      return new Promise((resolve, reject) => {
        const ta = document.createElement('textarea')
        ta.value = json
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try { document.execCommand('copy'); resolve() } catch (e) { reject(e) }
        ta.remove()
      })
    }
    copy().then(() => {
      ui.modal({
        title: '数据已复制',
        content: '备份数据已复制到剪贴板，请粘贴保存到安全位置（如备忘录或发送给自己）。',
        confirmText: '知道了'
      })
    }).catch(() => ui.toast('复制失败，请重试'))
  },

  onGoCalorieIntro() { App.go('/calorie-intro') },

  onDeleteWeight(date) {
    ui.confirm({
      title: '删除体重记录',
      content: `确定删除 ${date} 的体重记录吗？`,
      onConfirm: () => {
        dataStore.deleteWeightEntry(date)
        this.refresh()
        App.render()
        ui.toast('已删除')
      }
    })
  },

  onReset() {
    ui.confirm({
      title: '重置所有数据',
      content: '将清空所有训练、饮食记录和个人数据，此操作不可恢复。',
      onConfirm: () => {
        dataStore.resetAll()
        App.go('/onboard')
      }
    })
  },

  render() {
    const s = this.data
    if (s.editing) {
      const f = s.editForm
      const activityOptions = [['sedentary', '久坐'], ['light', '轻度'], ['moderate', '适度'], ['active', '活跃'], ['intense', '高强度']]
      const goalOptions = [['lose', '减脂'], ['maintain', '保持'], ['gain', '增肌']]
      return `
      <div class="card">
        <text class="card-title">编辑个人资料</text>
        <div class="form-group">
          <text class="form-label muted">昵称</text>
          <input class="form-input" value="${f.nickname || ''}" oninput="Pages['profile'].onFieldChange('nickname', this.value)" />
        </div>
        <div class="form-group">
          <text class="form-label muted">性别</text>
          <div class="gender-switch">
            <div class="gen-opt ${f.gender === 'male' ? 'active' : ''}" onclick="Pages['profile'].onGenderTap('male')">男</div>
            <div class="gen-opt ${f.gender === 'female' ? 'active' : ''}" onclick="Pages['profile'].onGenderTap('female')">女</div>
          </div>
        </div>
        <div class="form-row-3">
          <div class="form-group flex-1">
            <text class="form-label muted">身高 (cm)</text>
            <input class="form-input" type="number" inputmode="decimal" value="${f.heightCm || ''}" oninput="Pages['profile'].onFieldChange('heightCm', this.value)" />
          </div>
          <div class="form-group flex-1">
            <text class="form-label muted">体重 (kg)</text>
            <input class="form-input" type="number" inputmode="decimal" value="${f.weightKg || ''}" oninput="Pages['profile'].onFieldChange('weightKg', this.value)" />
          </div>
          <div class="form-group flex-1">
            <text class="form-label muted">年龄</text>
            <input class="form-input" type="number" inputmode="numeric" value="${f.age || ''}" oninput="Pages['profile'].onFieldChange('age', this.value)" />
          </div>
        </div>
        <div class="form-group">
          <text class="form-label muted">活动水平</text>
          <div class="opt-row">${activityOptions.map(([v, label]) => `
            <div class="opt-chip ${f.activityLevel === v ? 'active' : ''}" onclick="Pages['profile'].onOptTap('activityLevel', '${v}')">${label}</div>`).join('')}</div>
        </div>
        <div class="form-group">
          <text class="form-label muted">目标</text>
          <div class="opt-row">${goalOptions.map(([v, label]) => `
            <div class="opt-chip ${f.goal === v ? 'active' : ''}" onclick="Pages['profile'].onOptTap('goal', '${v}')">${label}</div>`).join('')}</div>
        </div>
      </div>
      <button class="btn-primary save-btn" onclick="Pages['profile'].onSaveProfile()">保存</button>
      <button class="btn-ghost cancel-btn" onclick="Pages['profile'].onCancelEdit()">取消</button>`
    }

    const p = s.profile
    const activityLabel = { sedentary: '久坐', light: '轻度活动', moderate: '适度活动', active: '活跃', intense: '高强度' }[p.activityLevel] || '轻度活动'
    const goalLabel = p.goal === 'lose' ? '减脂' : p.goal === 'gain' ? '增肌' : '保持'
    const levelLabel = p.level === 'beginner' ? '入门' : p.level === 'intermediate' ? '进阶' : '强化'

    return `
    <div class="container">
      <div class="card profile-head">
        <text class="nickname">${p.nickname}</text>
        <text class="muted">BMR ${s.summary.bmr} kcal · TDEE ${s.summary.tdee} kcal</text>
      </div>
      <div class="card">
        <text class="card-title">身体数据</text>
        <div class="body-stats">
          <div class="body-stat"><text class="bs-num">${p.heightCm}</text><text class="bs-unit muted">cm</text><text class="bs-label muted">身高</text></div>
          <div class="body-stat"><text class="bs-num">${p.weightKg}</text><text class="bs-unit muted">kg</text><text class="bs-label muted">体重</text></div>
          <div class="body-stat"><text class="bs-num">${p.age}</text><text class="bs-unit muted">岁</text><text class="bs-label muted">年龄</text></div>
          <div class="body-stat"><text class="bs-num">${s.summary.bmr}</text><text class="bs-unit muted">kcal</text><text class="bs-label muted">BMR</text></div>
        </div>
      </div>
      <div class="card">
        <text class="card-title">训练设置</text>
        <div class="setting-row row"><text class="muted">性别</text><text>${p.gender === 'male' ? '男' : '女'}</text></div>
        <div class="setting-row row"><text class="muted">活动水平</text><text>${activityLabel}</text></div>
        <div class="setting-row row"><text class="muted">目标</text><text>${goalLabel}</text></div>
        <div class="setting-row row"><text class="muted">训练水平</text><text>${levelLabel}</text></div>
      </div>
      ${s.weightHistory.length > 0 ? `
      <div class="card">
        <text class="card-title">体重记录</text>
        ${s.weightHistory.map(w => `
        <div class="weight-item">
          <text class="weight-date">${w.date}</text>
          <text class="weight-val">${w.weightKg} kg</text>
          <text class="weight-del" onclick="Pages['profile'].onDeleteWeight('${w.date}')">✕</text>
        </div>`).join('')}
      </div>` : ''}
      <button class="btn-primary edit-btn" onclick="Pages['profile'].onEdit()">编辑个人资料</button>
      <button class="btn-outline export-btn" onclick="Pages['profile'].onExport()">导出数据备份</button>
      <div class="card" style="margin-top:8px">
        <text class="card-title">其他</text>
        <div class="setting-row row" style="cursor:pointer" onclick="Pages['profile'].onGoCalorieIntro()">
          <text>🔥 了解热量缺口</text>
          <text class="row-arrow">›</text>
        </div>
      </div>
      <button class="btn-ghost reset-btn" onclick="Pages['profile'].onReset()">重置所有数据</button>
    </div>`
  }
}

})();

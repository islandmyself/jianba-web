;(function () {
/* 饮食 tab — 移植自小程序 pages/diet(照片经 photo-store 异步加载显示) */
const dataStore = __jianba('data')
const photoStore = __jianba('photo-store')

Pages['diet'] = {
  title: '饮食',
  tab: true,
  data: { entries: [], todayKcal: 0, selectedDate: '', dateLabel: '', isToday: true },

  onLoad() {
    if (!this.data.selectedDate) this.data.selectedDate = dataStore.todayStr()
    this.refresh()
  },

  refresh() {
    const date = this.data.selectedDate
    const today = dataStore.todayStr()
    const isToday = date === today
    const entries = dataStore.getDietByDate(date)
    const todayKcal = entries.reduce((s, e) => s + e.totalKcal, 0)
    this.data = {
      ...this.data,
      entries,
      todayKcal,
      isToday,
      dateLabel: this.formatDateLabel(date)
    }
    this._photoMap = {} // ts → dataURL,异步加载
  },

  formatDateLabel(dateStr) {
    const parts = dateStr.split('-')
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const week = ['日', '一', '二', '三', '四', '五', '六']
    return `${parseInt(parts[1])}月${parseInt(parts[2])}日 周${week[d.getDay()]}`
  },

  parseDate(str) {
    const parts = str.split('-')
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  },
  dateStr(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  },

  render() {
    const s = this.data
    const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
    const entries = s.entries.map((e, i) => `
      <div class="diet-entry">
        <div class="row">
          <div>
            <text class="entry-time">${mealLabels[e.mealType] || '记录'}</text>
            ${e.time ? `<text class="record-time">${e.time}</text>` : ''}
          </div>
          <text class="accent">${e.totalKcal} kcal</text>
        </div>
        ${e.photoPath ? `<img class="diet-photo" id="diet-photo-${e.ts}" data-path="${e.photoPath}" alt="记录照片" />` : ''}
        <div class="food-list">
          ${e.items.map(fi => `<text class="food-tag">${fi.food} ${fi.grams}g (${fi.kcal}kcal)</text>`).join('')}
        </div>
        <div class="row" style="margin-top:6px">
          <text class="muted" style="font-size:11px">${e.date} ${e.time || ''}</text>
          <div style="display:flex;gap:12px">
            <text class="edit-btn" onclick="Pages['diet'].onEdit('${e.ts}')">编辑</text>
            <text class="delete-btn" onclick="Pages['diet'].onDelete('${e.ts}')">删除</text>
          </div>
        </div>
        ${i < s.entries.length - 1 ? '<div class="divider"></div>' : ''}
      </div>`).join('')

    return `
    <div class="diet-hint">
      <text class="hint-text">记录就好，不用纠结每克都精确。感知自己的身体，比数着卡路里更重要。</text>
    </div>
    <div class="date-nav">
      <div class="date-nav-arrow" onclick="Pages['diet'].onPrevDay()"><text class="arrow-text">〈</text></div>
      <input type="date" class="date-nav-center date-input" value="${s.selectedDate}" max="${dataStore.todayStr()}" onchange="Pages['diet'].onDateChange(this.value)" />
      <div class="date-nav-arrow ${s.isToday ? 'arrow-disabled' : ''}" onclick="Pages['diet'].onNextDay()"><text class="arrow-text">〉</text></div>
      ${s.isToday ? '' : `<div class="date-nav-today" onclick="Pages['diet'].onGoToday()"><text class="today-btn-text">今天</text></div>`}
    </div>
    <div class="card today-summary">
      <text class="card-title">${s.isToday ? '今日饮食' : s.dateLabel + ' 饮食'}</text>
      <div class="row" style="margin-top:8px">
        <div>
          <text class="big-kcal">${s.todayKcal}</text>
          <text class="muted"> kcal 已摄入</text>
        </div>
        <button class="btn-primary add-btn" onclick="Pages['diet'].onAdd()">+ 记录饮食</button>
      </div>
    </div>
    ${s.entries.length > 0 ? `
    <div class="card">
      <text class="card-title">记录详情</text>
      ${entries}
    </div>` : `
    <div class="empty-card">
      <text style="font-size:30px;display:block;margin-bottom:8px">🍽️</text>
      <text class="muted">${s.isToday ? '今天还没记录饮食' : '当天无饮食记录'}</text>
      ${s.isToday ? '<text class="muted">点击上方按钮开始记录</text>' : ''}
    </div>`}
    <div class="tip-card card">
      <text class="card-title" style="font-size:13px">关于拍照识食</text>
      <text class="muted">
        内置 60+ 种常见食物和菜品的卡路里数据。
        AI 拍照识别需要接入第三方 API，后续版本会加入。
        目前可以：拍照作为记录参考 + 搜索选择食物名称来计算热量。
      </text>
    </div>`
  },

  mount(root) {
    // 异步加载照片
    root.querySelectorAll('img.diet-photo').forEach(img => {
      const path = img.dataset.path
      photoStore.load(path).then(url => {
        if (url) img.src = url
        else img.style.display = 'none'
      }).catch(() => { img.style.display = 'none' })
    })
  },

  onPrevDay() {
    const d = this.parseDate(this.data.selectedDate)
    d.setDate(d.getDate() - 1)
    this.data.selectedDate = this.dateStr(d)
    this.refresh()
    App.render()
  },
  onNextDay() {
    if (this.data.isToday) return
    const d = this.parseDate(this.data.selectedDate)
    d.setDate(d.getDate() + 1)
    const nextStr = this.dateStr(d)
    if (nextStr > dataStore.todayStr()) return
    this.data.selectedDate = nextStr
    this.refresh()
    App.render()
  },
  onDateChange(v) {
    if (!v) return
    this.data.selectedDate = v
    this.refresh()
    App.render()
  },
  onGoToday() {
    this.data.selectedDate = dataStore.todayStr()
    this.refresh()
    App.render()
  },

  onAdd() { App.go('/diet-add') },
  onEdit(ts) { App.go('/diet-add?ts=' + ts) },
  onDelete(ts) {
    ui.confirm({
      title: '删除记录',
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

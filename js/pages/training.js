/* 训练 tab — 移植自小程序 pages/training */
const dataStore = __jianba('data')

Pages['training'] = {
  title: '训练',
  tab: true,
  data: { trainings: [], todayKcal: 0, hasMore: false, pageSize: 30 },

  onLoad() {
    this.refresh()
  },

  refresh() {
    const today = dataStore.getTodayTrainings()
    const todayKcal = today.reduce((s, t) => s + t.totalKcal, 0)
    const all = dataStore.getAllTrainings()
    const pageSize = this.data.pageSize
    this.data = {
      ...this.data,
      trainings: all.slice(0, pageSize),
      todayKcal,
      hasMore: all.length > pageSize
    }
    this._allTrainings = all
  },

  render() {
    const s = this.data
    const items = s.trainings.map((t, i) => `
      <div class="training-item">
        <div class="row">
          <div>
            <text class="date-text">${t.date}</text>
            ${t.time ? `<text class="record-time">${t.time}</text>` : ''}
          </div>
          <text class="accent">${t.totalKcal} kcal</text>
        </div>
        <div class="ex-list">
          ${t.exercises.map(ex => `<text class="ex-tag">${ex.name} ${ex.weight}kg ${ex.reps}×${ex.sets}</text>`).join('')}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:4px">
          <text class="view-btn" onclick="Pages['training'].onViewDay('${t.date}')">查看详情</text>
          <text class="edit-btn" onclick="Pages['training'].onEdit('${t.ts}')">编辑</text>
          <text class="delete-btn" onclick="Pages['training'].onDelete('${t.ts}')">删除</text>
        </div>
        ${i < s.trainings.length - 1 ? '<div class="divider"></div>' : ''}
      </div>`).join('')

    return `
    <div class="training-slogan">
      <text class="slogan-text">🧘 记录每一次努力，不和任何人比</text>
    </div>
    <div class="card today-summary">
      <text class="card-title">今日训练</text>
      <div class="row" style="margin-top:8px">
        <div>
          <text class="big-kcal">${s.todayKcal}</text>
          <text class="muted"> kcal 已消耗</text>
        </div>
        <button class="btn-primary add-btn" onclick="Pages['training'].onAdd()">+ 记录训练</button>
      </div>
    </div>
    ${s.trainings.length > 0 ? `
    <div class="card">
      <text class="card-title">训练记录</text>
      ${items}
    </div>
    ${s.hasMore ? `<div class="load-more-wrap"><button class="btn-ghost load-more-btn" onclick="Pages['training'].onLoadMore()">加载更多</button></div>` : ''}` : `
    <div class="empty-card">
      <text style="font-size:30px;display:block;margin-bottom:8px">💪</text>
      <text class="muted">还没有训练记录</text>
      <text class="muted">点击上方按钮开始记录</text>
    </div>`}`
  },

  onLoadMore() {
    const all = this._allTrainings || dataStore.getAllTrainings()
    const current = this.data.trainings.length
    const next = all.slice(current, current + this.data.pageSize)
    this.data.trainings = [...this.data.trainings, ...next]
    this.data.hasMore = current + this.data.pageSize < all.length
    App.render()
  },

  onAdd() { App.go('/training-record') },
  onViewDay(date) { App.go('/day-detail?date=' + date) },
  onEdit(ts) { App.go('/training-record?ts=' + ts) },
  onDelete(ts) {
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
  }
}

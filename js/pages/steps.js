/* 步数页 — 移植自小程序 pages/steps(7 天柱状图 + 手动输入) */
const dataStore = __jianba('data')

Pages['steps'] = {
  title: '步数',
  data: { steps: 0, stepKcal: 0, distanceKm: 0, profile: {}, chart: [], maxBarSteps: 1, weekTotal: 0, weekAvg: 0, bestDay: '', bestSteps: 0, weekKcal: 0 },

  onLoad() {
    this.refresh()
  },

  refresh() {
    const profile = dataStore.getProfile()
    const summary = dataStore.getDailySummary()
    const steps = summary.steps
    const stepKcal = summary.stepKcal
    const distanceKm = steps > 0 ? parseFloat((steps * profile.heightCm * 0.45 / 100 / 1000).toFixed(2)) : 0

    const history = dataStore.getHistory()
    const today = dataStore.todayStr()
    const pastDays = []
    for (let i = 6; i >= 1; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      pastDays.push(`${d.getFullYear()}-${m}-${day}`)
    }

    const chart = []
    let maxSteps = 0
    let weekTotal = 0
    pastDays.forEach(date => {
      const rec = history.find(h => h.date === date)
      const s = rec ? rec.steps : 0
      chart.push({ date: date.slice(5), steps: s, label: date.slice(8) })
      if (s > maxSteps) maxSteps = s
      weekTotal += s
    })
    chart.push({ date: today.slice(5), steps, label: '今天' })
    if (steps > maxSteps) maxSteps = steps
    weekTotal += steps

    const weekAvg = Math.round(weekTotal / 7)
    const weekKcal = Math.round(weekTotal * (profile.weightKg / 60) * 0.04)

    let bestDay = ''
    let bestSteps = 0
    chart.forEach(c => { if (c.steps > bestSteps) { bestSteps = c.steps; bestDay = c.label } })

    this.data.steps = steps
    this.data.stepKcal = stepKcal
    this.data.distanceKm = distanceKm
    this.data.profile = profile
    this.data.chart = chart
    this.data.maxBarSteps = maxSteps || 1
    this.data.weekTotal = weekTotal
    this.data.weekAvg = weekAvg
    this.data.bestDay = bestDay
    this.data.bestSteps = bestSteps
    this.data.weekKcal = weekKcal
  },

  render() {
    const s = this.data
    const bars = s.chart.map(c => `
      <div class="bar-col">
        <div class="bar-fill" style="height:${Math.round(c.steps / s.maxBarSteps * 100)}%"></div>
        <text class="bar-val">${c.steps}</text>
        <text class="bar-label">${c.label}</text>
      </div>`).join('')

    return `
    <div class="container">
      <div class="card header-card">
        <div class="big-num-wrap">
          <text class="big-num">${s.steps}</text>
          <text class="big-unit"> 步</text>
        </div>
        <div class="in-out-row">
          <div class="in-out-item">
            <text class="in-out-val" style="color:#f97316">${s.stepKcal} kcal</text>
            <text class="in-out-label">消耗热量</text>
          </div>
          <div class="in-out-divider"></div>
          <div class="in-out-item">
            <text class="in-out-val" style="color:#06b6d4">${s.distanceKm} km</text>
            <text class="in-out-label">估算距离</text>
          </div>
        </div>
        <div class="formula-hint">
          <text class="muted">距离 ≈ 步数 × 身高(${s.profile.heightCm}cm) × 0.45</text>
        </div>
      </div>

      <div class="card">
        <text class="card-title">近 7 天步数</text>
        <div class="chart-wrap">${bars}</div>
      </div>

      <div class="card">
        <text class="card-title">本周统计</text>
        <div class="summary-grid">
          <div class="sum-item"><text class="sum-val">${s.weekTotal}</text><text class="sum-label muted">7天总步数</text></div>
          <div class="sum-item"><text class="sum-val">${s.weekAvg}</text><text class="sum-label muted">日均步数</text></div>
          <div class="sum-item"><text class="sum-val">${s.weekKcal}</text><text class="sum-label muted">7天消耗</text></div>
          <div class="sum-item"><text class="sum-val">${s.bestSteps}</text><text class="sum-label muted">最高 ${s.bestDay}</text></div>
        </div>
      </div>

      <div class="card step-card">
        <div class="row">
          <div>
            <text class="card-title" style="margin-bottom:0">${s.steps > 0 ? `今日步数：${s.steps}` : '记录今日步数'}</text>
            <text class="muted">${s.steps > 0 ? `约消耗 ${s.stepKcal} kcal` : '输入微信运动显示的步数以计算消耗'}</text>
          </div>
          <button class="btn-ghost sync-btn" onclick="Pages['steps'].onManualInput()">${s.steps > 0 ? '更新' : '输入步数'}</button>
        </div>
      </div>

      <div class="card info-card">
        <text class="card-title">步数消耗怎么算的？</text>
        <text class="muted info-text">
          步数为手动输入（微信运动显示的数字）。
          步行热量消耗 ≈ 步数 × 体重系数 × 0.04。
          距离为估值：步数 × 身高 × 0.45（步幅系数）。
          仅供日常参考，实际消耗受步速、地形、个人差异影响。
        </text>
      </div>
    </div>`
  },

  // MVP 手动输入步数(自动同步需云函数解密,小程序版同样待迭代)
  onManualInput() {
    ui.modal({
      title: '输入今日步数',
      editable: true,
      placeholderText: '输入微信运动步数',
      confirmText: '确定'
    }).then(v => {
      if (v === null) return
      const steps = parseInt(v)
      if (steps >= 0) {
        dataStore.setSteps(steps)
        this.refresh()
        App.render()
        ui.toast('步数已更新')
      }
    })
  }
}

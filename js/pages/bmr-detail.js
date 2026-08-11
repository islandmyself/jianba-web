/* 热量详情页 — 移植自小程序 pages/bmr-detail(摄入/消耗时段时间轴) */
const calc = __jianba('calc')
const dataStore = __jianba('data')

Pages['bmr-detail'] = {
  title: '热量详情',
  data: { deficit: 0, deficitLabel: '', totalIn: 0, totalOut: 0, bmrNow: 0, timeline: [], currentSegmentLabel: '', hasEvents: false },

  onLoad() {
    this.refresh()
  },

  refresh() {
    const profile = dataStore.getProfile()
    const summary = dataStore.getDailySummary()
    const bmr = calc.calcBMR(profile.gender, profile.weightKg, profile.heightCm, profile.age)
    const bmrNow = calc.calcBMRNow(bmr)
    const bmrByHour = calc.getBMRByHour(bmr)
    const currentHour = new Date().getHours()

    const allDiet = dataStore.getTodayDietEntries()
    const allTraining = dataStore.getTodayTrainings()

    const segmentDefs = [
      { label: '0:00-7:00', hours: [0, 1, 2, 3, 4, 5, 6] },
      { label: '7:00', hours: [7] }, { label: '8:00', hours: [8] }, { label: '9:00', hours: [9] },
      { label: '10:00', hours: [10] }, { label: '11:00', hours: [11] }, { label: '12:00', hours: [12] },
      { label: '13:00', hours: [13] }, { label: '14:00', hours: [14] }, { label: '15:00', hours: [15] },
      { label: '16:00', hours: [16] }, { label: '17:00', hours: [17] }, { label: '18:00', hours: [18] },
      { label: '19:00', hours: [19] }, { label: '20:00', hours: [20] }, { label: '21:00-24:00', hours: [21, 22, 23] }
    ]

    const timeline = segmentDefs.map(def => {
      let totalBmr = 0
      let intake = 0
      let expend = 0
      def.hours.forEach(h => {
        totalBmr += bmrByHour[h] || 0
        allDiet.forEach(d => {
          const t = d.time ? parseInt(d.time.split(':')[0]) : new Date(d.ts).getHours()
          if (t === h) intake += d.totalKcal
        })
        allTraining.forEach(t => {
          const th = t.time ? parseInt(t.time.split(':')[0]) : new Date(t.ts).getHours()
          if (th === h) expend += t.totalKcal
        })
      })
      const allPast = def.hours.every(h => h < currentHour)
      const allFuture = def.hours.every(h => h > currentHour)
      const isCurrent = !allPast && !allFuture
      return {
        label: def.label,
        bmr: Math.round(totalBmr),
        intake: Math.round(intake),
        expend: Math.round(expend),
        status: isCurrent ? 'current' : allPast ? 'past' : 'future',
        isCurrent
      }
    })

    const currentSeg = timeline.find(s => s.isCurrent)
    this.data.deficit = Math.abs(summary.deficit)
    this.data.deficitLabel = summary.deficit >= 0 ? '热量缺口' : '热量盈余'
    this.data.totalIn = summary.totalIn
    this.data.totalOut = summary.totalOut
    this.data.bmrNow = bmrNow
    this.data.timeline = timeline
    this.data.currentSegmentLabel = currentSeg ? currentSeg.label : ''
    this.data.hasEvents = timeline.some(s => s.intake > 0 || s.expend > 0)
  },

  render() {
    const s = this.data
    const gapClass = s.deficitLabel === '热量缺口' ? 'gap-green' : 'gap-red'
    const tl = s.timeline.map((t, i) => `
      <div class="tl-node">
        <div class="tl-left">
          <div class="tl-dot ${t.status} ${t.isCurrent ? 'pulse' : ''}"></div>
          ${i < s.timeline.length - 1 ? `<div class="tl-line ${t.status}"></div>` : ''}
        </div>
        <div class="tl-right">
          <div class="tl-info">
            <text class="tl-time ${t.status}">${t.label}</text>
            <text class="tl-bmr ${t.status}">${t.bmr} kcal</text>
          </div>
          <div class="tl-events">
            ${t.intake > 0 ? `<text class="tl-intake">+${t.intake}</text>` : ''}
            ${t.expend > 0 ? `<text class="tl-expend">-${t.expend}</text>` : ''}
          </div>
        </div>
      </div>`).join('')

    return `
    <div class="container">
      <div class="card header-card">
        <div class="deficit-row">
          <div class="deficit-main">
            <text class="deficit-val ${gapClass}">${s.deficit}</text>
            <text class="deficit-unit"> kcal</text>
          </div>
          <text class="deficit-label-text ${gapClass}">${s.deficitLabel}</text>
        </div>
        <div class="in-out-row">
          <div class="in-out-item">
            <text class="in-out-val" style="color:#06b6d4">${s.totalIn}</text>
            <text class="in-out-label">今日摄入</text>
          </div>
          <div class="in-out-divider"><text style="font-size:12px;color:#a8a29e">VS</text></div>
          <div class="in-out-item">
            <text class="in-out-val" style="color:#f97316">${s.totalOut}</text>
            <text class="in-out-label">今日消耗</text>
          </div>
        </div>
        ${s.bmrNow > 0 ? `<div class="current-bmr-hint"><text class="muted">当前基础代谢已消耗 </text><text class="accent">${s.bmrNow} kcal</text></div>` : ''}
      </div>

      <div class="card">
        <text class="card-title">热量缺口时间轴</text>
        <div class="timeline">${tl}</div>
        ${s.hasEvents ? `
        <div class="tl-legend">
          <div class="legend-item"><div class="ldot intake"></div><text class="muted">摄入</text></div>
          <div class="legend-item"><div class="ldot expend"></div><text class="muted">消耗</text></div>
        </div>` : ''}
      </div>

      <div class="card info-card">
        <text class="card-title">关于热量计算</text>
        <text class="muted info-text">
          BMR（基础代谢）：你躺着不动一天消耗的热量。
          每日总消耗 = BMR × 1.2（基础活动）+ 训练消耗 + 步数消耗。
          每日热量缺口 = 总消耗 — 饮食摄入。
          减脂建议每天缺口 300-500 kcal，增肌建议盈余 200-400 kcal。
        </text>
      </div>
    </div>`
  }
}

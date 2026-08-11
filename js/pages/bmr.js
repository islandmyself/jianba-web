/* 基础代谢页 — 移植自小程序 pages/bmr(24h 代谢曲线) */
const calc = __jianba('calc')
const dataStore = __jianba('data')

Pages['bmr'] = {
  title: '基础代谢',
  data: { bmr: 0, bmrNow: 0, timeline: [], currentHour: 0 },

  onLoad() {
    this.refresh()
  },

  refresh() {
    const profile = dataStore.getProfile()
    const bmr = calc.calcBMR(profile.gender, profile.weightKg, profile.heightCm, profile.age)
    const bmrNow = calc.calcBMRNow(bmr)
    const bmrByHour = calc.getBMRByHour(bmr)
    const currentHour = new Date().getHours()

    const timeline = []
    for (let h = 0; h < 24; h++) {
      const isPast = h < currentHour
      const isCurrent = h === currentHour
      timeline.push({
        hour: h,
        time: h + ':00',
        bmr: bmrByHour[h],
        status: isCurrent ? 'current' : isPast ? 'past' : 'future',
        isCurrent
      })
    }
    this.data.bmr = bmr
    this.data.bmrNow = bmrNow
    this.data.timeline = timeline
    this.data.currentHour = currentHour
  },

  render() {
    const s = this.data
    const tl = s.timeline.map((t, i) => `
      <div class="tl-node">
        <div class="tl-left">
          <div class="tl-dot ${t.status} ${t.isCurrent ? 'pulse' : ''}"></div>
          ${i < 23 ? `<div class="tl-line ${t.status}"></div>` : ''}
        </div>
        <div class="tl-right">
          <text class="tl-time ${t.status}">${t.time}</text>
          <text class="tl-bmr ${t.status}">${t.bmr} kcal</text>
        </div>
      </div>`).join('')

    return `
    <div class="container">
      <div class="card header-card">
        <div class="header-row">
          <div class="header-item header-item-secondary">
            <text class="header-val-secondary">${s.bmr}</text>
            <text class="header-label">全天 BMR</text>
          </div>
          <div class="header-item header-item-primary">
            <text class="header-val-primary">${s.bmrNow}</text>
            <text class="header-label-primary">当前已消耗</text>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="timeline">${tl}</div>
      </div>
      <div class="card science-card">
        <text class="card-title">代谢曲线计算方式与科学依据</text>
        <div class="science-block">
          <text class="science-subtitle">BMR 计算公式</text>
          <text class="science-text">采用 Mifflin-St Jeor 方程（1990），是国际公认最准确的基础代谢估算公式之一：</text>
          <text class="science-formula">男性：BMR = 10×体重 + 6.25×身高 - 5×年龄 + 5</text>
          <text class="science-formula">女性：BMR = 10×体重 + 6.25×身高 - 5×年龄 - 161</text>
        </div>
        <div class="science-block">
          <text class="science-subtitle">昼夜节律模型</text>
          <text class="science-text">基础代谢并非全天恒定。根据 Zitting 等人 2018 年发表在《Current Biology》的研究，人体静息能量消耗（REE）随昼夜节律波动约 ±10%：</text>
          <text class="science-text">· 深夜至清晨（0:00-6:00）：代谢最低，约为平均值的 84-87%</text>
          <text class="science-text">· 上午至中午（6:00-12:00）：代谢逐渐升高，达到平均值的 90-105%</text>
          <text class="science-text">· 下午（12:00-18:00）：代谢达到峰值，约为平均值的 103-108%</text>
          <text class="science-text">· 晚间（18:00-24:00）：代谢缓慢下降，回到平均值的 86-100%</text>
        </div>
        <div class="science-block">
          <text class="science-subtitle">实时 BMR 计算方式</text>
          <text class="science-text">全天 BMR 按 24 小时分配，每小时分配的热量 = BMR × 该小时节律系数 ÷ 24小时系数总和。"当前已消耗" = 从 0 点累加至当前时刻的 BMR 分量，让你实时了解自己此刻已经消耗了多少基础热量。</text>
        </div>
        <div class="science-block">
          <text class="science-subtitle">首页消耗计算公式</text>
          <text class="science-text">首页「今日消耗」是实时累计值，公式为：</text>
          <text class="science-formula">消耗 = 基础代谢(实时) × 1.2 + 训练消耗 + 步数消耗</text>
          <text class="science-text">· ×1.2：日常基础活动消耗（站立、走动、办公等），约为基础代谢的 20%</text>
          <text class="science-text">· 训练消耗：力量训练、有氧等运动消耗</text>
          <text class="science-text">· 步数消耗：走路消耗，约 0.04 kcal/步（以 60kg 体重为基准，按实际体重调整）</text>
          <text class="science-text tip-note">💡 所有数值均为实时累计（从凌晨至今），所以基础代谢与今日消耗会随时间变化，且两者之间有 ×1.2 的差值。</text>
        </div>
      </div>
    </div>`
  }
}

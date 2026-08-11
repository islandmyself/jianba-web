;(function () {
/* 评分详情页 — 移植自小程序 pages/score-detail
   onLoad 支持 ?date=YYYY-MM-DD(从某日详情进入),不带 date 则显示今天 */
const dataStore = __jianba('data')

const DIM_META = {
  calorie: {
    icon: '🔥', name: '热量管理',
    desc: '根据你的目标和实际热量缺口评分。减脂目标缺口 300-500 kcal 为最优区间，保持目标 ±150 kcal 为最优。缺口过大（>1000）会扣分。',
    tips: { lose: '保持每日缺口 300-500 kcal', maintain: '摄入与消耗差距控制在 ±150 kcal', gain: '保持每日盈余 200-400 kcal' }
  },
  training: {
    icon: '💪', name: '训练',
    desc: '对比你近 7 天的训练消耗均值。超过均值 10% 得满分，达到 80% 正常。系统会识别恢复状态，高强度训练后建议休息。',
    tips: { default: '每周训练 3-5 次，消耗稳定在个人均值附近' }
  },
  diet: {
    icon: '🍽️', name: '饮食质量',
    desc: '从蛋白质摄入（占热量比）、蔬果摄入、零食控制三个维度评分。三餐完整额外加分。',
    tips: { default: '保证蛋白质摄入，每餐有蔬果，控制高热量零食' }
  },
  sleep: {
    icon: '😴', name: '睡眠',
    desc: '综合睡眠时长（7-8h 最佳）、入睡规律性（固定时间±30min 满分）、入睡时间（22:00 前最佳）三项评分。',
    tips: { default: '保证 7-8 小时睡眠，固定入睡时间，尽量 23:00 前入睡' }
  },
  habit: {
    icon: '📊', name: '记录习惯',
    desc: '今日记录完整度（步数≥500、训练≥50kcal、饮食≥200kcal、睡眠≥3h 各算一项）+ 连续坚持奖励。4 项全满 70 分，连续 30 天额外 +30 分。不鼓励"吃老本"，今天偷懒分就低。',
    tips: { default: '每天把步数、训练、饮食、睡眠都记全，连续坚持越久分越高' }
  }
}

Pages['score-detail'] = {
  title: '评分详情',
  data: { scoreOutput: null, dimList: [], profile: {} },

  onLoad(params) {
    const date = (params && params.date) || dataStore.todayStr()
    const scoreOutput = dataStore.getScoreForDate(date)
    const profile = dataStore.getProfile()
    const dims = scoreOutput.dimensions || {}
    const dimList = ['calorie', 'training', 'diet', 'sleep', 'habit'].map(k => (Object.assign({ key: k }, DIM_META[k], { data: dims[k] || null })))
    this.data.scoreOutput = scoreOutput
    this.data.dimList = dimList
    this.data.profile = profile
  },

  render() {
    const s = this.data
    const sc = s.scoreOutput
    const levelLabel = l => l === 'high' ? '优秀' : l === 'mid' ? '正常' : l === 'rest' ? '恢复' : l === 'silent' ? '未记录' : '偏低'
    const typeLabel = sc && (sc.userType === 'strength' ? '力量型' : sc.userType === 'cardio' ? '有氧型' : sc.userType === 'diet_only' ? '纯饮食型' : '混合型')

    const dims = s.dimList.map(item => {
      if (!item.data) return ''
      const d = item.data
      const keyData = {
        calorie: d.deficit !== undefined ? `热量缺口 ${d.deficit} kcal · 总消耗 ${d.totalOut} kcal · BMR ${d.bmr} kcal` : '',
        training: d.todayKcal !== undefined ? `今日训练 ${d.todayKcal} kcal · 近期均值 ${d.baseline} kcal` : (d.label || ''),
        habit: `今日记录 ${d.filled}/4 项 · 连续 ${d.streak} 天`,
        sleep: d.duration !== undefined ? `睡眠 ${d.duration}h · 入睡 ${d.bedTime || '未记录'}` : ''
      }[item.key] || ''
      const tips = item.tips[s.profile.goal] || item.tips.default
      return `
      <div class="dim-card card">
        <div class="dim-header">
          <text class="dim-icon">${item.icon}</text>
          <text class="dim-name">${item.name}</text>
          <div class="dim-score-wrap">
            <text class="dim-pct ${d.level}">${d.pct}%</text>
            <text class="dim-level-tag ${d.level}">${levelLabel(d.level)}</text>
          </div>
        </div>
        ${keyData ? `<div class="dim-data"><text class="dim-data-text">${keyData}</text></div>` : ''}
        <div class="dim-desc">${item.desc}</div>
        <div class="dim-tips">
          <text class="tips-label">💡 ${s.profile.goal === 'lose' && item.key === 'calorie' ? '减脂建议' : s.profile.goal === 'gain' && item.key === 'calorie' ? '增肌建议' : '建议'}</text>
          <text class="tips-text">${tips}</text>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${d.pct}%;background:${d.level === 'high' ? '#10b981' : d.level === 'mid' ? '#f59e0b' : d.level === 'rest' ? '#06b6d4' : d.level === 'silent' ? '#e5e7eb' : '#ef4444'}"></div></div>
      </div>`
    }).join('')

    const weightText = sc && {
      strength: '力量型：热量 20% · 训练 33% · 饮食 23% · 睡眠 12% · 习惯 12%',
      cardio: '有氧型：热量 18% · 训练 28% · 饮食 18% · 睡眠 14% · 习惯 22%',
      diet_only: '纯饮食型：热量 35% · 饮食 28% · 睡眠 17% · 习惯 20%',
      hybrid: '混合型：热量 20% · 训练 27% · 饮食 23% · 睡眠 15% · 习惯 15%'
    }[sc.userType] || ''

    return `
    <div class="container">
      ${sc ? `
      <div class="card header-card">
        <div class="header-row">
          <div class="header-left">
            <text class="header-score">${sc.totalScore}</text>
            <text class="header-unit">/100</text>
          </div>
          <div class="header-right">
            <text class="header-type">${typeLabel}</text>
            ${sc.depth && sc.depth.phase !== 'mature'
              ? `<text class="header-depth">${sc.depth.phase === 'early' ? '新手期 · 第' + sc.depth.days + '天' : '积累期 · ' + sc.depth.days + '天数据'}</text>`
              : sc.depth ? `<text class="header-depth mature">成熟期 · ${sc.depth.days}天数据</text>` : ''}
          </div>
        </div>
        ${sc.summaryText ? `<div class="header-summary">${sc.summaryText}</div>` : ''}
        <div class="header-guide">分数不是考核，是帮你看见今天的自己比昨天进步了多少。</div>
      </div>` : ''}
      ${dims}
      <div class="card info-card">
        <text class="card-title">权重分配</text>
        <text class="muted" style="line-height:1.8;display:block">${weightText}</text>
        <text class="muted" style="line-height:1.8;display:block;margin-top:8px">
          权重根据你的运动类型自动调整。力量型重训练，纯饮食型重热量和饮食，混合型均衡分配。数据积累不足时，习惯权重提高、训练权重降低，让新手更容易获得正向反馈。
        </text>
      </div>
    </div>`
  }
}

})();

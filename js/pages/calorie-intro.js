;(function () {
/* 热量缺口科普页 — 移植自小程序 pages/calorie-intro(4 屏,触摸滑动切换) */
const dataStore = __jianba('data')

Pages['calorie-intro'] = {
  title: '了解热量缺口',
  data: { current: 0, goal: 'maintain', goalInfo: null },

  onLoad() {
    const profile = dataStore.getProfile()
    const goalMap = {
      lose: { label: '减脂', range: '300~500 kcal', icon: '🔥', desc: '每周约减 0.3~0.5 kg，安全健康，不易反弹' },
      maintain: { label: '保持', range: '±200 kcal', icon: '⚖️', desc: '基本维持当前体重' },
      gain: { label: '增肌', range: '200~400 kcal', icon: '💪', desc: '需要多余热量支持肌肉生长' }
    }
    this.data.goal = profile.goal || 'maintain'
    this.data.goalInfo = goalMap[profile.goal] || goalMap.maintain
  },

  slides() {
    const goal = this.data.goal
    return [
      `<div class="slide">
        <text class="slide-icon">🔥</text>
        <text class="slide-title">什么是热量缺口？</text>
        <text class="slide-sub">简单来说，就是你每天消耗的热量减去吃进去的热量</text>
        <div class="formula-card">
          <text class="formula-line-text">每天消耗的热量</text>
          <text class="formula-op">−</text>
          <text class="formula-line-text">每天吃进去的热量</text>
          <div class="formula-divider"></div>
          <text class="formula-result">= 热量缺口</text>
        </div>
        <div class="mini-cards">
          <div class="mini-card good">
            <text class="mini-card-symbol">+</text>
            <text class="mini-card-title">缺口 &gt; 0</text>
            <text class="mini-card-desc">消耗大于摄入</text>
            <text class="mini-card-tag">在变瘦 👍</text>
          </div>
          <div class="mini-card warn">
            <text class="mini-card-symbol">−</text>
            <text class="mini-card-title">缺口 &lt; 0</text>
            <text class="mini-card-desc">摄入大于消耗</text>
            <text class="mini-card-tag">在变胖 ⚠</text>
          </div>
        </div>
      </div>`,
      `<div class="slide">
        <text class="slide-icon">📊</text>
        <text class="slide-title">消耗是怎么算出来的？</text>
        <div class="formula-bar">总消耗 = BMR × 1.2 + 训练消耗 + 步数消耗</div>
        <div class="breakdown-card">
          <div class="breakdown-item">
            <text class="breakdown-icon">🫁</text>
            <div class="breakdown-body">
              <text class="breakdown-label">基础代谢（BMR）</text>
              <text class="breakdown-desc">躺着不动也会消耗的热量，由性别、体重、身高、年龄决定，约占 60%</text>
            </div>
            <text class="breakdown-pct">~60%</text>
          </div>
          <div class="breakdown-item">
            <text class="breakdown-icon">🚶</text>
            <div class="breakdown-body">
              <text class="breakdown-label">日常活动消耗</text>
              <text class="breakdown-desc">BMR × 1.2，包括走路、通勤、做家务等</text>
            </div>
            <text class="breakdown-pct">~15%</text>
          </div>
          <div class="breakdown-item">
            <text class="breakdown-icon">🏋️</text>
            <div class="breakdown-body">
              <text class="breakdown-label">训练消耗</text>
              <text class="breakdown-desc">力量训练记录，每个动作都有对应的 MET 值</text>
            </div>
            <text class="breakdown-pct">~20%</text>
          </div>
          <div class="breakdown-item">
            <text class="breakdown-icon">👣</text>
            <div class="breakdown-body">
              <text class="breakdown-label">步数消耗</text>
              <text class="breakdown-desc">每步约 0.04 kcal，体重越大消耗越多</text>
            </div>
            <text class="breakdown-pct">~5%</text>
          </div>
        </div>
      </div>`,
      `<div class="slide">
        <text class="slide-icon">🎯</text>
        <text class="slide-title">缺口多大才合适？</text>
        <div class="goal-card">
          <div class="goal-row ${goal === 'lose' ? 'goal-highlight' : ''}">
            <text class="goal-row-icon">🔥</text>
            <div class="goal-row-body">
              <text class="goal-row-label">减脂</text>
              <text class="goal-row-range">每日缺口 300 ~ 500 kcal</text>
              <text class="goal-row-desc">每周约减 0.3~0.5 kg，安全健康，不易反弹</text>
            </div>
          </div>
          <div class="goal-row ${goal === 'maintain' ? 'goal-highlight' : ''}">
            <text class="goal-row-icon">⚖️</text>
            <div class="goal-row-body">
              <text class="goal-row-label">保持</text>
              <text class="goal-row-range">每日缺口 ±200 kcal 以内</text>
              <text class="goal-row-desc">基本维持当前体重</text>
            </div>
          </div>
          <div class="goal-row ${goal === 'gain' ? 'goal-highlight' : ''}">
            <text class="goal-row-icon">💪</text>
            <div class="goal-row-body">
              <text class="goal-row-label">增肌</text>
              <text class="goal-row-range">每日盈余 200 ~ 400 kcal</text>
              <text class="goal-row-desc">需要多余热量支持肌肉生长</text>
            </div>
          </div>
        </div>
        <div class="warn-card">
          <text class="warn-icon">⚠</text>
          <text class="warn-text">缺口不宜过大（&gt; 700 kcal/天），否则会导致肌肉流失、代谢下降、容易反弹</text>
        </div>
      </div>`,
      `<div class="slide">
        <text class="slide-icon">💡</text>
        <text class="slide-title">怎么看懂首页的数字？</text>
        <div class="demo-card">
          <div class="demo-bar-row">
            <text class="demo-bar-label">摄入</text>
            <div class="demo-bar-track"><div class="demo-bar-fill" style="width:60%"></div></div>
            <text class="demo-bar-val">1500 kcal</text>
          </div>
          <div class="demo-bar-row">
            <text class="demo-bar-label">消耗</text>
            <div class="demo-bar-track full"><div class="demo-bar-fill full-fill" style="width:100%"></div></div>
            <text class="demo-bar-val">2000 kcal</text>
          </div>
          <div class="demo-result">
            <text class="demo-result-label">缺口</text>
            <text class="demo-result-val">+500 kcal</text>
          </div>
        </div>
        <div class="tips-list">
          <div class="tip-item"><text class="tip-dot orange"></text><text>进度条越短 = 缺口越大 = 减脂效果越好</text></div>
          <div class="tip-item"><text class="tip-dot red"></text><text>进度条超过消耗线 = 吃超了，明天多动动</text></div>
        </div>
        <div class="action-callout">
          <text class="callout-text">每天记录训练和饮食，首页自动帮你算 🔥</text>
        </div>
      </div>`
    ]
  },

  render() {
    const s = this.data
    const dots = [0, 1, 2, 3].map(i => `<div class="dot ${s.current === i ? 'active' : ''}" onclick="Pages['calorie-intro'].onGo(${i})"></div>`).join('')
    return `
    <div class="intro-page" ontouchstart="Pages['calorie-intro'].onTouchStart(event)" ontouchend="Pages['calorie-intro'].onTouchEnd(event)">
      <div class="intro-swiper">${this.slides()[s.current]}</div>
      <div class="indicator">${dots}</div>
      <div class="footer">
        ${s.current < 3
          ? `<div class="skip-btn" onclick="Pages['calorie-intro'].onSkip()">跳过</div>`
          : `<div class="done-btn" onclick="Pages['calorie-intro'].onDone()">我明白了，开始使用</div>`}
      </div>
    </div>`
  },

  onGo(i) { this.data.current = i; App.render() },
  onSkip() { App.go('/index') },
  onDone() { App.go('/index') },

  onTouchStart(e) { this._touchX = e.touches[0].clientX },
  onTouchEnd(e) {
    if (this._touchX == null) return
    const dx = e.changedTouches[0].clientX - this._touchX
    this._touchX = null
    if (Math.abs(dx) < 50) return
    if (dx < 0 && this.data.current < 3) { this.data.current++; App.render() }
    else if (dx > 0 && this.data.current > 0) { this.data.current--; App.render() }
  }
}

})();

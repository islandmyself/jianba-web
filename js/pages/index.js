/* 首页仪表盘 — 移植自小程序 pages/index,交互/提醒/评分逻辑一致 */
const dataStore = __jianba('data')
const calc = __jianba('calc')

Pages['index'] = {
  title: '首页',
  tab: true,
  data: {},

  onLoad() {
    this.refresh()
  },

  refresh() {
    const profile = dataStore.getProfile()
    const summary = dataStore.getDailySummary()
    const history = dataStore.getHistory()
    const d = new Date()
    const week = ['日', '一', '二', '三', '四', '五', '六']

    const dietKcal = summary.dietKcal
    const totalOut = summary.totalOut
    const deficitPct = totalOut > 0 ? Math.min(100, Math.round((dietKcal / totalOut) * 100)) : 50

    const goalLabels = { lose: '减脂', maintain: '保持', gain: '增肌' }

    const lastWeightDate = dataStore.getLastWeightDate()
    let showWeightReminder = false
    if (lastWeightDate) {
      const last = new Date(lastWeightDate.replace(/-/g, '/'))
      const today = new Date(dataStore.todayStr().replace(/-/g, '/'))
      showWeightReminder = Math.floor((today - last) / 86400000) >= 7
    }

    const showDietReminder = d.getHours() >= 19 && summary.dietKcal === 0
    const showBodyBanner = profile.heightCm === 170 && profile.weightKg === 65 && profile.age === 28 && dataStore.getWeightHistory().length === 0

    const scoreOutput = this.buildScoreOutput()
    const dims = (scoreOutput && scoreOutput.dimensions) || {}
    const dimList = ['calorie', 'training', 'diet', 'sleep', 'habit'].map(k => ({
      key: k,
      label: k === 'calorie' ? '热量' : k === 'training' ? '训练' : k === 'diet' ? '饮食' : k === 'sleep' ? '睡眠' : '习惯',
      data: dims[k] || null
    }))

    this.data = {
      nickname: profile.nickname,
      summary,
      history,
      steps: summary.steps,
      dateText: `${d.getMonth() + 1}月${d.getDate()}日 周${week[d.getDay()]}`,
      deficitPercent: deficitPct,
      goalLabel: goalLabels[profile.goal] || '保持',
      showWeightReminder,
      showDietReminder,
      showBodyBanner,
      scoreOutput,
      dimList,
      todaySleep: dataStore.getTodayRecord().sleep || null,
      showSleepModal: false,
      sleepForm: { bedTime: '23:30', wakeTime: '07:00', durationHours: '7.5' }
    }
  },

  buildScoreOutput() {
    return dataStore.getScoreForDate(dataStore.todayStr())
  },

  render() {
    const s = this.data
    if (!s.nickname) return ''
    const sc = s.scoreOutput
    const sleepText = s.todaySleep
      ? s.todaySleep.durationHours + 'h' + ((s.todaySleep.bedTime || s.todaySleep.wakeTime) ? ' ' + (s.todaySleep.bedTime || '') + (s.todaySleep.bedTime && s.todaySleep.wakeTime ? '~' : '') + (s.todaySleep.wakeTime || '') : '')
      : '点击记录昨晚睡眠时长'

    const typeLabel = sc ? (sc.userType === 'strength' ? '力量型' : sc.userType === 'cardio' ? '有氧型' : sc.userType === 'diet_only' ? '纯饮食型' : '混合型') : ''
    const dims = (s.dimList || []).map(d => d.data ? `
      <view class="score-dim">
        <text class="dim-name">${d.label}</text>
        <view class="dim-bar-wrap">
          <view class="progress-bar dim-bar"><view class="progress-fill" style="width:${d.data.pct}%;background:${d.data.level === 'high' ? '#10b981' : d.data.level === 'mid' ? '#f59e0b' : d.data.level === 'rest' ? '#06b6d4' : d.data.level === 'silent' ? '#e5e7eb' : '#ef4444'}"></view></view>
          <text class="dim-pct ${d.data.level}">${d.data.pct}%</text>
        </view>
      </view>` : '').join('')

    const milestones = sc && sc.milestones && sc.milestones.length
      ? `<view class="score-milestones">${sc.milestones.map(m => `<text class="milestone-tag">${m}</text>`).join('')}</view>` : ''

    const historyHtml = s.history.length > 0 ? `
      <view class="section-title" style="font-weight:600;margin:14px 0 8px;color:#1c1917">历史记录</view>
      <view class="history-list">${s.history.map(h => `
        <view class="card history-item" onclick="Pages['index'].onDayTap('${h.date}')">
          <view class="row" style="align-items:flex-start">
            <view style="flex:1">
              <text class="history-date">${h.date}</text>
              <view class="muted">训练 ${h.trainingKcal} · 饮食 ${h.dietKcal} · 步数 ${h.steps}</view>
            </view>
            <view class="history-scores">
              <text class="history-score-val">${h.score}</text>
              <text class="muted" style="font-size:9px">分</text>
              <text class="history-val ${h.deficit > 0 ? 'deficit-green' : 'deficit-red'}" style="margin-left:10px">${h.deficit > 0 ? '-' : '+'}${h.deficit}</text>
              <text class="muted" style="font-size:9px"> kcal</text>
            </view>
            <text class="history-arrow">></text>
          </view>
        </view>`).join('')}</view>` : `<view class="card empty-history"><text class="muted">从这里开始，记录属于你的每一天</text></view>`

    return `
    <div class="header row">
      <div>
        <text class="greet">${s.nickname}，今天怎么样？</text>
        <text class="greet-slogan">${s.slogan || ''}</text>
        <text class="muted">${s.dateText} · ${s.goalLabel}模式</text>
      </div>
      ${s.steps > 0 ? `<div style="text-align:center"><text class="steps-num">${s.steps}</text><text class="muted" style="font-size:10px">步</text></div>` : ''}
    </div>

    ${s.showBodyBanner ? `
    <div class="card body-banner" onclick="Pages['index'].onGoProfile()">
      <div class="row">
        <div>
          <text class="banner-icon">💡</text><text class="banner-title">完善你的身体数据</text>
          <text class="muted banner-sub">获取专属热量目标和健身计划</text>
        </div>
        <text class="reminder-arrow">></text>
      </div>
    </div>` : ''}

    ${sc ? `
    <div class="card score-card" onclick="Pages['index'].onScoreTap()">
      <view class="score-header row">
        <view class="score-total-wrap">
          <text class="score-number ${sc.totalScore >= 80 ? 'deficit-green' : sc.totalScore >= 60 ? 'mood-tired' : 'deficit-red'}">${sc.totalScore}</text>
          <text class="score-unit">/100</text>
          ${sc.depth && sc.depth.phase !== 'mature' ? `<view class="score-depth-tag"><text class="depth-tag-text">${sc.depth.phase === 'early' ? '新手期' : '积累期'}</text></view>` : ''}
        </view>
        <view class="score-type"><text class="tag">${typeLabel}</text></view>
      </view>
      <view class="score-summary">${sc.summaryText || ''}</view>
      <div class="divider" style="margin:8px 0"></div>
      <view class="score-dims">${dims}</view>
      ${milestones}
      <view class="detail-hint"><text class="detail-hint-text">查看打分详情</text><text class="detail-hint-arrow">›</text></view>
    </div>` : ''}

    <div class="card sleep-card" onclick="Pages['index'].onRecordSleep()">
      <div class="row">
        <div>
          <text class="card-title" style="margin-bottom:0">😴 记录睡眠</text>
          <text class="muted">${sleepText}</text>
        </div>
        <text class="reminder-arrow">></text>
      </div>
    </div>

    <div class="card main-card">
      <div class="calorie-ring-wrap">
        <div class="ring-container">
          <div class="ring-bg"></div>
          <div class="ring-fill" style="background:conic-gradient(#f97316 ${s.deficitPercent > 100 ? 360 : s.deficitPercent * 3.6}deg, #e5e7eb 0deg)"></div>
          <div class="ring-mask"></div>
          <div class="ring-center">
            <text class="deficit-num ${s.summary.deficit > 0 ? 'deficit-green' : 'deficit-red'}">${s.summary.deficit}</text>
            <text class="deficit-unit"> kcal</text>
            <text class="deficit-label ${s.summary.deficit > 0 ? 'deficit-green' : 'deficit-red'}">${s.summary.deficitLabel}</text>
          </div>
        </div>
      </div>
      <div class="calorie-breakdown">
        <div class="break-item">
          <text class="break-val" style="color:#06b6d4">${s.summary.totalIn} kcal</text>
          <text class="muted">今日摄入</text>
        </div>
        <div class="break-divider"><text style="font-size:12px;color:#a8a29e">VS</text></div>
        <div class="break-item">
          <text class="break-val" style="color:#f97316">${s.summary.totalOut} kcal</text>
          <text class="muted">今日消耗</text>
        </div>
      </div>
      <text class="cal-formula-hint">今日消耗 = 基础代谢 + 日常活动 + 训练 + 步数</text>
      <div class="divider"></div>
      <div class="row">
        <text class="muted">摄入 / 消耗</text>
        <text class="accent">${s.deficitPercent}%</text>
      </div>
      <div class="progress-wrap" style="margin-top:6px">
        <view class="progress-bar diet-bar"><view class="progress-fill" style="width:${s.deficitPercent > 100 ? 100 : s.deficitPercent}%;background:${s.deficitPercent > 100 ? '#ef4444' : '#f97316'}"></view></view>
      </div>
      <div class="detail-hint" onclick="Pages['index'].onBMRTap()"><text class="detail-hint-text">点击查看详细数据</text><text class="detail-hint-arrow">›</text></div>
    </div>

    <div class="stat-grid">
      <div class="stat-card" onclick="Pages['index'].onGoBMR()">
        <text class="stat-icon">🔥</text><text class="stat-val">${s.summary.bmrNow}</text>
        <text class="muted" style="font-size:11px">基础代谢 ›</text>
      </div>
      <div class="stat-card" onclick="Pages['index'].onGoSteps()">
        <text class="stat-icon">🚶</text><text class="stat-val">${s.summary.stepKcal}</text>
        <text class="muted" style="font-size:11px">步数消耗 ›</text>
      </div>
      <div class="stat-card" onclick="Pages['index'].onGoTraining()">
        <text class="stat-icon">💪</text><text class="stat-val">${s.summary.trainingKcal}</text>
        <text class="muted" style="font-size:11px">训练消耗</text>
      </div>
      <div class="stat-card" onclick="Pages['index'].onGoDiet()">
        <text class="stat-icon">🍽️</text><text class="stat-val">${s.summary.dietKcal}</text>
        <text class="muted" style="font-size:11px">今日摄入</text>
      </div>
    </div>

    ${s.showWeightReminder ? `
    <div class="card reminder-card" onclick="Pages['index'].onGoProfile()">
      <div class="row">
        <div class="reminder-left"><text class="reminder-icon">⚖️</text><text class="reminder-text">该更新体重啦</text></div>
        <text class="reminder-arrow">></text>
      </div>
    </div>` : ''}
    ${s.showDietReminder ? `
    <div class="card reminder-card" onclick="Pages['index'].onGoDiet()">
      <div class="row">
        <div class="reminder-left"><text class="reminder-icon">🍽️</text><text class="reminder-text">今天还没记录饮食</text></div>
        <text class="reminder-arrow">></text>
      </div>
    </div>` : ''}

    ${s.steps === 0 ? `
    <div class="card step-card">
      <div class="row">
        <div><text class="card-title" style="margin-bottom:0">今日步数</text><text class="muted">输入微信运动显示的步数</text></div>
        <button class="btn-ghost sync-btn" onclick="Pages['index'].onSyncSteps()">输入步数</button>
      </div>
    </div>` : `
    <div class="card step-card">
      <div class="row">
        <div><text class="card-title" style="margin-bottom:0">今日步数：${s.steps}</text><text class="muted">约消耗 ${s.summary.stepKcal} kcal</text></div>
        <button class="btn-ghost sync-btn" onclick="Pages['index'].onSyncSteps()">更新</button>
      </div>
    </div>`}

    <div class="quick-actions">
      <button class="btn-primary action-btn" onclick="Pages['index'].onGoTraining()">记录今日训练</button>
      <button class="btn-ghost action-btn" onclick="Pages['index'].onGoDiet()">记录今日饮食</button>
    </div>

    ${historyHtml}

    ${this.data.showSleepModal ? this.sleepModalHtml() : ''}
    `
  },

  sleepModalHtml() {
    const f = this.data.sleepForm
    return `
    <div class="modal-mask" onclick="Pages['index'].onCancelSleepModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px">
          <text style="font-size:17px;font-weight:700">记录睡眠</text>
          <text style="font-size:18px;color:#a8a29e;cursor:pointer" onclick="Pages['index'].onCancelSleepModal()">✕</text>
        </div>
        <div style="padding:8px 16px 12px">
          <div style="margin-bottom:12px">
            <text style="display:block;font-size:13px;color:#44403c;margin-bottom:6px">🕐 入睡时间</text>
            <input type="time" class="sleep-picker" value="${f.bedTime}" onchange="Pages['index'].onSleepBedChange(this.value)" />
          </div>
          <div style="margin-bottom:12px">
            <text style="display:block;font-size:13px;color:#44403c;margin-bottom:6px">🕗 醒来时间</text>
            <input type="time" class="sleep-picker" value="${f.wakeTime}" onchange="Pages['index'].onSleepWakeChange(this.value)" />
          </div>
          ${f.durationHours ? `
          <div>
            <text style="display:block;font-size:13px;color:#44403c;margin-bottom:6px">⏱ 睡眠时长</text>
            <div class="sleep-dur-display"><text class="sleep-dur-value">${f.durationHours}</text><text class="sleep-dur-unit">小时</text></div>
          </div>` : ''}
        </div>
        <div style="display:flex;gap:8px;padding:0 16px 16px">
          <button class="sleep-btn-cancel" onclick="Pages['index'].onCancelSleepModal()">取消</button>
          <button class="sleep-btn-save" onclick="Pages['index'].onSaveSleepFromModal()">保存</button>
        </div>
      </div>
    </div>`
  },

  calcDuration(bed, wake) {
    if (!bed || !wake) return ''
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let mins = (wh * 60 + wm) - (bh * 60 + bm)
    if (mins <= 0) mins += 24 * 60
    return (mins / 60).toFixed(1)
  },

  onSleepBedChange(v) {
    const f = this.data.sleepForm
    f.bedTime = v
    f.durationHours = this.calcDuration(v, f.wakeTime)
    App.render()
  },
  onSleepWakeChange(v) {
    const f = this.data.sleepForm
    f.wakeTime = v
    f.durationHours = this.calcDuration(f.bedTime, v)
    App.render()
  },
  onRecordSleep() {
    const cur = dataStore.getTodayRecord().sleep || {}
    this.data.sleepForm = {
      bedTime: cur.bedTime || '23:30',
      wakeTime: cur.wakeTime || '07:00',
      durationHours: cur.durationHours != null ? String(cur.durationHours) : this.calcDuration('23:30', '07:00')
    }
    this.data.showSleepModal = true
    App.render()
  },
  onCancelSleepModal() {
    this.data.showSleepModal = false
    App.render()
  },
  onSaveSleepFromModal() {
    const f = this.data.sleepForm
    if (!f.bedTime || !f.wakeTime) { ui.toast('请选择入睡和醒来时间'); return }
    const dur = parseFloat(f.durationHours)
    if (isNaN(dur) || dur < 0.5 || dur > 16) { ui.toast('睡眠时长异常，请重新选择时间'); return }
    dataStore.updateSleep(dataStore.todayStr(), { durationHours: dur, bedTime: f.bedTime, wakeTime: f.wakeTime })
    this.data.showSleepModal = false
    this.refresh()
    App.render()
    ui.toast('睡眠已记录')
  },

  onSyncSteps() {
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
  },

  onGoTraining() { App.go('/training') },
  onGoDiet() { App.go('/diet') },
  onGoProfile() { App.go('/profile') },
  onGoSteps() { App.go('/steps') },
  onGoBMR() { App.go('/bmr') },
  onBMRTap() { App.go('/bmr-detail') },
  onDayTap(date) { App.go('/day-detail?date=' + date) },
  onScoreTap() { App.go('/score-detail') }
}

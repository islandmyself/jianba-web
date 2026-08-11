;(function () {
/* 首次引导 — 移植自小程序 pages/onboard */
const dataStore = __jianba('data')

Pages['onboard'] = {
  title: '开始使用',
  data: { nickname: '健身人', gender: 'male', heightCm: '', weightKg: '', age: '' },

  render() {
    const s = this.data
    return `
    <div class="onboard">
      <div class="hero">
        <text class="logo">你就健吧</text>
        <text class="slogan">关注自己，每天比昨天更好</text>
      </div>
      <div class="card">
        <text class="card-title">怎么称呼你？</text>
        <input class="input" placeholder="输入昵称" value="${s.nickname}" oninput="Pages['onboard'].onNameInput(this.value)" />
        <text class="card-title" style="margin-top:16px">性别</text>
        <div class="gender-row">
          <div class="gen-opt ${s.gender === 'male' ? 'active' : ''}" onclick="Pages['onboard'].onGenderTap('male')">男</div>
          <div class="gen-opt ${s.gender === 'female' ? 'active' : ''}" onclick="Pages['onboard'].onGenderTap('female')">女</div>
        </div>
        <text class="card-title" style="margin-top:16px">身体数据</text>
        <div class="body-row">
          <div class="body-field"><input class="input" type="number" inputmode="decimal" placeholder="身高 cm" value="${s.heightCm}" oninput="Pages['onboard'].onBodyInput('heightCm', this.value)" /></div>
          <div class="body-field"><input class="input" type="number" inputmode="decimal" placeholder="体重 kg" value="${s.weightKg}" oninput="Pages['onboard'].onBodyInput('weightKg', this.value)" /></div>
          <div class="body-field"><input class="input" type="number" inputmode="numeric" placeholder="年龄" value="${s.age}" oninput="Pages['onboard'].onBodyInput('age', this.value)" /></div>
        </div>
        <button class="btn-primary start" onclick="Pages['onboard'].onStart()">开始使用</button>
      </div>
      <div class="hint"><text class="hint-text">身体数据和目标可在「我的」中随时修改 →</text></div>
    </div>`
  },

  onNameInput(v) { this.data.nickname = v },
  onGenderTap(v) { this.data.gender = v; App.render() },
  onBodyInput(field, v) { this.data[field] = v },

  onStart() {
    const s = this.data
    if (!s.nickname.trim()) { ui.toast('请输入昵称'); return }
    const heightCm = Number(s.heightCm)
    const weightKg = Number(s.weightKg)
    const age = Number(s.age)
    if (!heightCm || heightCm < 100 || heightCm > 250) { ui.toast('身高范围 100-250 cm'); return }
    if (!weightKg || weightKg < 30 || weightKg > 250) { ui.toast('体重范围 30-250 kg'); return }
    if (!age || age < 10 || age > 120) { ui.toast('年龄范围 10-120 岁'); return }
    dataStore.setProfile({
      nickname: s.nickname,
      onboarded: true,
      gender: s.gender,
      heightCm, weightKg, age
    })
    App.go('/index')
  }
}

})();

/* SPA 路由与页面生命周期
   页面注册:Pages['name'] = { title, tab, onLoad(params), render(), mount(root), onShow() }
   App.go('/route?key=val') 切换页面;tab 页面显示底部导航,子页面显示返回键 */
const App = {
  routes: {}, // path → page 对象
  tabKeys: [], // 底部 tab 的 path 列表

  register(path, page) {
    this.routes[path] = page
    if (page.tab) this.tabKeys.push(path)
  },

  // 解析 '/a/b?x=1' → { path, params }
  parse(hash) {
    const clean = hash.replace(/^#/, '')
    const [path, query] = clean.split('?')
    const params = {}
    if (query) query.split('&').forEach(kv => {
      const [k, v] = kv.split('=')
      params[decodeURIComponent(k)] = decodeURIComponent(v || '')
    })
    return { path: path || '/index', params }
  },

  go(url) {
    location.hash = '#' + url
  },

  back() {
    if (history.length > 1) history.back()
    else location.hash = '#/index'
  },

  current() {
    const { path, params } = this.parse(location.hash)
    return { page: this.routes[path], path, params }
  },

  render() {
    const { page, path, params } = this.current()
    const key = location.hash.replace(/^#/, '')
    const root = document.getElementById('app')
    root.innerHTML = ''

    if (!page) {
      root.innerHTML = '<div class="empty-page">页面不存在</div>'
      return
    }

    // 导航:tab 页无返回,子页有返回键
    const isTab = !!page.tab
    document.getElementById('nav').style.display = isTab ? 'none' : 'flex'
    document.getElementById('tabbar').style.display = isTab ? 'flex' : 'none'
    ui.setNavTitle(page.title || '')
    document.querySelectorAll('.tab-item').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === path)
    })

    // 仅当路径/参数变化时执行 onLoad(模拟小程序页面生命周期,保留交互中间状态)
    if (key !== this._lastKey) {
      this._lastKey = key
      if (page.onLoad) page.onLoad(params)
    }
    root.innerHTML = page.render()
    if (page.mount) page.mount(root)
    window.scrollTo(0, 0)
    if (page.onShow) page.onShow()
  },

  start() {
    window.addEventListener('hashchange', () => this.render())
    if (!location.hash) location.hash = '#/index'
    this.render()
    this.initKeyboardCompat()
  },

  // Android 软键盘兼容:键盘弹出时 fixed 底部元素(保存栏/面板/tabbar)被顶起,
  // 键盘收起后点击命中区域与视觉位置错位(老内核 WebView 经典 bug)→ 点按钮无反应。
  // 方案:键盘打开时隐藏 fixed 底部元素;键盘确认收起后(visualViewport 恢复 + 无 input 焦点)
  // 再恢复并强制重排,修复点击命中区域。
  // 注意:不能靠 opened 标志配对 focusin/focusout——搜索页输入会触发渲染重建、旧 input 被移除,
  // 焦点丢失产生的 focusout 会重置状态,导致真正的键盘收起事件被短路。
  initKeyboardCompat() {
    const isSoftInput = t => t && t.tagName === 'INPUT' && t.type !== 'time' && t.type !== 'date' && t.type !== 'checkbox' && t.type !== 'radio'
    const kbVisible = () => {
      if (window.visualViewport) return window.visualViewport.height < window.innerHeight - 50
      return false
    }
    const isInputFocused = () => isSoftInput(document.activeElement)
    const restore = () => {
      document.body.classList.remove('kb-open')
      // 强制重排,修复 fixed 元素的点击命中区域
      const el = document.querySelector('.float-bar, #tabbar')
      if (el) { el.style.display = 'none'; void el.offsetHeight; el.style.display = '' }
    }
    document.addEventListener('focusin', e => {
      if (isSoftInput(e.target)) document.body.classList.add('kb-open')
    })
    document.addEventListener('focusout', () => {
      // 延迟等键盘收起动画;若键盘仍可见(如输入中渲染重建)则不恢复,避免闪烁
      setTimeout(() => { if (!isInputFocused() && !kbVisible()) restore() }, 150)
    })
    // 兜底:老内核键盘弹收可能只触发 resize(焦点事件丢失)
    window.addEventListener('resize', () => {
      if (!isInputFocused() && !kbVisible()) restore()
    })
  }
}

window.App = App
window.Pages = window.Pages || {}

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
  }
}

window.App = App
window.Pages = window.Pages || {}

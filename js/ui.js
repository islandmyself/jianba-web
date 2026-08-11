/* UI 工具:toast / modal(可输入,模拟微信 showModal)/ confirm / vibrate / 标题 */
const ui = {
  toast(title, duration = 2000) {
    let el = document.getElementById('toast')
    if (!el) {
      el = document.createElement('div')
      el.id = 'toast'
      document.body.appendChild(el)
    }
    el.textContent = title
    el.className = 'show'
    clearTimeout(el._timer)
    el._timer = setTimeout(() => { el.className = '' }, duration)
  },

  // 模拟 wx.showModal;opts: { title, content, editable, placeholderText, confirmText, cancelText }
  // 返回 Promise:resolve(输入值或 true) / resolve(null) 表示取消
  modal(opts) {
    return new Promise(resolve => {
      const root = document.createElement('div')
      root.className = 'modal-mask'
      root.innerHTML = `
        <div class="modal">
          <div class="modal-title">${opts.title || ''}</div>
          ${opts.content ? `<div class="modal-content">${opts.content}</div>` : ''}
          ${opts.editable ? `<input class="modal-input" placeholder="${opts.placeholderText || ''}" />` : ''}
          <div class="modal-btns">
            <button class="modal-btn cancel">${opts.cancelText || '取消'}</button>
            <button class="modal-btn confirm">${opts.confirmText || '确定'}</button>
          </div>
        </div>`
      document.body.appendChild(root)
      const input = root.querySelector('.modal-input')
      if (input) setTimeout(() => { input.focus() }, 50)
      const close = val => { root.remove(); resolve(val) }
      root.querySelector('.cancel').onclick = () => close(null)
      root.querySelector('.confirm').onclick = () => {
        close(input ? input.value : true)
      }
      if (input) input.onkeydown = e => { if (e.key === 'Enter') root.querySelector('.confirm').click() }
    })
  },

  // 确认弹窗(无输入),确认时执行回调
  confirm(opts) {
    this.modal({ title: opts.title, content: opts.content, confirmText: opts.confirmText })
      .then(r => { if (r) opts.onConfirm && opts.onConfirm() })
  },

  vibrate() {
    try { if (navigator.vibrate) navigator.vibrate(10) } catch (e) {}
  },

  setNavTitle(title) {
    document.title = title || '你就健吧'
    const nav = document.getElementById('nav-title')
    if (nav) nav.textContent = title || ''
  }
}

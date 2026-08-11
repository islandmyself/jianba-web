/* 照片库:IndexedDB 存储压缩后的 base64 图,键为 'photos/<ts>.jpg'
   无 IndexedDB 环境(如 node 测试)退化为内存 Map,便于冒烟验证 */
const DB_NAME = 'jianleme_photos'
const STORE = 'photos'

let db = null
let memStore = new Map()

function openDB() {
  if (db) return Promise.resolve(db)
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => { db = req.result; resolve(db) }
    req.onerror = () => reject(req.error)
  })
}

function save(key, dataURL) {
  if (typeof indexedDB === 'undefined') { memStore.set(key, dataURL); return Promise.resolve() }
  return openDB().then(d => new Promise((resolve, reject) => {
    if (!d) { memStore.set(key, dataURL); return resolve() }
    const tx = d.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataURL, key)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  }))
}

function load(key) {
  if (typeof indexedDB === 'undefined') return Promise.resolve(memStore.get(key) || null)
  return openDB().then(d => new Promise((resolve, reject) => {
    if (!d) return resolve(memStore.get(key) || null)
    const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  }))
}

function remove(key) {
  if (typeof indexedDB === 'undefined') { memStore.delete(key); return Promise.resolve() }
  return openDB().then(d => new Promise((resolve, reject) => {
    if (!d) { memStore.delete(key); return resolve() }
    const tx = d.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  }))
}

function clear() {
  if (typeof indexedDB === 'undefined') { memStore.clear(); return Promise.resolve() }
  return openDB().then(d => new Promise((resolve, reject) => {
    if (!d) { memStore.clear(); return resolve() }
    const tx = d.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  }))
}

/* 图片文件压缩为 jpeg dataURL(最长边 maxSize,quality 0.7),浏览器环境用 */
function compressImage(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } catch (e) { URL.revokeObjectURL(url); reject(e) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片读取失败')) }
    img.src = url
  })
}

module.exports = { save, load, remove, clear, compressImage }

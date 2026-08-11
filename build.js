/* 打包器:把 js/ 下的 CommonJS 模块(与小程序版共享)打成浏览器可用的单文件 bundle.js
   改动 js/*.js 后运行: node build.js(数据层文件本身保持 CommonJS,node 测试照常) */
const fs = require('fs')
const path = require('path')

const mods = ['calc.js', 'score.js', 'foods.js', 'photo-store.js', 'data.js']
const parts = [`/* 自动生成 by build.js — 勿手改,源文件在 js/ 下 */`,
`(function () {
  const __mods = {}
  function __define(name, fn) { const m = { exports: {} }; fn(m, m.exports); __mods[name] = m.exports }
  function __require(name) { return __mods[String(name).replace(/^\\.\\//, '').replace(/\\.js$/, '')] }
  window.__jianba = __require
`]
for (const f of mods) {
  let src = fs.readFileSync(path.join(__dirname, 'js', f), 'utf8')
  src = src.replace(/require\(['"](\.[^'"]+)['"]\)/g, "__require('$1')")
  parts.push(`__define('${f.replace(/\.js$/, '')}', function (module, exports) {`)
  parts.push(src)
  parts.push('});\n')
}
parts.push('})();\n')
fs.writeFileSync(path.join(__dirname, 'js', 'bundle.js'), parts.join('\n'))
console.log('bundle.js 已生成 (' + mods.length + ' 个模块)')

# 你就健吧 · 网页版

轻量健身记录工具的 GitHub Pages 版 —— 训练、饮食、步数、睡眠、每日评分,数据只存在你自己的浏览器里(localStorage + IndexedDB),不上传任何服务器。

> 与微信小程序版(D:\jianba)同源:数据层(热量计算、评分、食物库)从小程序代码原样复用,功能与交互保持一致。

## 功能

- 📊 首页仪表盘:热量缺口圆环、实时基础代谢、每日评分(5 维度)
- 🏋️ 训练记录:60+ 动作库(MET 值计算)、自定义动作、按天分页查看
- 🍽️ 饮食记录:搜索 60+ 食物、常见份量快速添加、自定义食物、拍照存本地
- 🚶 步数:手动输入(微信运动数字),7 天柱状图
- 😴 睡眠:时长与作息记录
- 🏆 每日评分:热量/训练/饮食/睡眠/习惯 5 维加权,按运动类型自动调权重
- 📖 热量科普:4 屏图文了解热量缺口

## 使用

1. 手机浏览器打开 GitHub Pages 地址(https://islandmyself.github.io/jianba-web/)
2. 首次进入填写昵称与身体数据
3. 建议用浏览器菜单「添加到主屏幕」,体验接近 App

## 数据说明

- 所有数据保存在浏览器本地,清除浏览器数据会丢失记录
- 「我的 → 导出数据备份」可把全部数据复制为 JSON 保存
- 照片压缩后存浏览器 IndexedDB(最长边 800px,JPEG)

## 本地开发

```bash
python -m http.server 8080   # 静态服务器
node _smoke.js               # 数据层冒烟测试(9 场景)
node build.js                # 重建 js/bundle.js(数据层改动后)
```

## 目录

```
index.html         SPA 入口(hash 路由,13 页)
css/style.css      全站样式(橙色主题,与小程序一致)
js/bundle.js       build.js 打包的数据层(calc/score/foods/photo-store/data)
js/pages/*.js      13 个页面
js/app.js          路由与渲染
js/ui.js           toast / 弹窗 / 确认框
_smoke.js          数据层测试
```

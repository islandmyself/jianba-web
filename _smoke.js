/* 网页版数据层冒烟测试:node 环境 mock localStorage/photoStore
   改动 js/data.js / js/photo-store.js 后运行: node _smoke.js(输出必须全绿) */
const assert = require('assert')
const dataStore = require('./js/data.js')
const photoStore = require('./js/photo-store.js')

// mock localStorage
let store = {}
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: k => { delete store[k] }
}

let failed = 0
function test(name, fn) {
  try { fn(); console.log('  OK   ' + name) }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message) }
}
function testAsync(name, fn) {
  return fn().then(() => console.log('  OK   ' + name)).catch(e => { failed++; console.log('  FAIL ' + name + ' — ' + e.message) })
}

const TODAY = dataStore.todayStr()
const calc = require('./js/calc.js')
const EX_KEY = Object.keys(calc.EXERCISE_MET)[0] || 'squat'
const EX_MET = calc.EXERCISE_MET[EX_KEY] || 5

function seed() {
  dataStore._resetCache()
  store = {}
  dataStore.setProfile({ nickname: '测', onboarded: true, gender: 'male', heightCm: 175, weightKg: 70, age: 28, activityLevel: 'light', goal: 'lose' })
}

test('存储:profile 持久化 + 体重历史', () => {
  seed()
  assert.strictEqual(dataStore.getProfile().heightCm, 175)
  assert.strictEqual(dataStore.getWeightHistory().length, 1)
  dataStore.setProfile({ weightKg: 71 })
  assert.strictEqual(dataStore.getWeightHistory().length, 2)
  assert.strictEqual(dataStore.getWeightOnDate('2999-01-01'), 71)
})

test('存储:localStorage 真实落盘', () => {
  seed()
  dataStore.setSteps(5000)
  const raw = JSON.parse(store['jianleme_data'])
  assert.strictEqual(raw.dailyRecords[TODAY].steps, 5000)
})

test('聚合:训练增删差额', () => {
  seed()
  const r = dataStore.addTraining([{ key: EX_KEY, weight: 50, reps: 10, sets: 3, met: EX_MET }], '09:00')
  assert.strictEqual(dataStore.getRecordByDate(TODAY).trainingKcal, r.totalKcal)
  assert.strictEqual(dataStore.deleteTrainingEntry(r.record.ts), true)
  assert.strictEqual(dataStore.getRecordByDate(TODAY).trainingKcal, 0)
})

test('聚合:饮食增删差额', () => {
  seed()
  const r = dataStore.addDietEntry([{ food: '白米饭', grams: 200, kcal: 232 }], '', '12:00', 'lunch')
  assert.strictEqual(dataStore.getRecordByDate(TODAY).dietKcal, 232)
  assert.strictEqual(dataStore.deleteDietEntry(r.record.ts), true)
  assert.strictEqual(dataStore.getRecordByDate(TODAY).dietKcal, 0)
})

test('口径:getDailySummary 走 TDEE', () => {
  seed()
  const s = dataStore.getDailySummary()
  const bmr = calc.calcBMR('male', 70, 175, 28)
  const tdee = calc.calcTDEE(bmr, 'light')
  assert.strictEqual(s.totalOut, tdee) // 无步数无训练时 totalOut === TDEE
  assert.ok(s.bmrNow > 0)
})

test('评分:getScoreForDate 可跑且含总分', () => {
  seed()
  dataStore.setSteps(6000)
  dataStore.addDietEntry([{ food: '白米饭', grams: 300, kcal: 348 }])
  const sc = dataStore.getScoreForDate(TODAY)
  assert.strictEqual(typeof sc.totalScore, 'number')
  assert.ok(Array.isArray(sc.milestones))
})

test('resetAll:清空存储', () => {
  seed()
  dataStore.setSteps(100)
  dataStore.resetAll()
  assert.deepStrictEqual(store, {})
  assert.strictEqual(dataStore.getProfile().nickname, '健身人')
})

test('缓存:load 复用', () => {
  seed()
  assert.strictEqual(dataStore.load(), dataStore.load())
  dataStore.load().profile.nickname = 'x'
  dataStore._resetCache()
  assert.strictEqual(dataStore.getProfile().nickname, '测')
})

async function main() {
  await testAsync('照片:photoStore 存取删 + deletePhotoFile guard', async () => {
    const p = '/photos/1.jpg' // 与小程序版路径语义一致:含 '/photos/'
    await photoStore.save(p, 'data:image/jpeg;base64,xxx')
    assert.strictEqual(await photoStore.load(p), 'data:image/jpeg;base64,xxx')
    dataStore.deletePhotoFile(p)
    await new Promise(r => setTimeout(r, 10))
    assert.strictEqual(await photoStore.load(p), null)
    dataStore.deletePhotoFile('photos/2.jpg') // 无前导斜杠 → guard 拦截,不删
    dataStore.deletePhotoFile('') // 空路径 → 不删
  })
  console.log(failed === 0 ? '\n全部通过 ✔' : `\n${failed} 个测试失败 ✘`)
  process.exit(failed === 0 ? 0 : 1)
}
main()
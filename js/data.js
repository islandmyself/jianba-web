/* 网页版数据层:与小程序版 D:\jianba\utils\data.js 接口签名一致
   存储后端:wx.getStorageSync → localStorage;照片文件系统 → photo-store(IndexedDB)
   注意:逻辑改动后需与小程序版同步,并跑冒烟测试 */
const calc = require('./calc.js')
const foods = require('./foods.js')
const score = require('./score.js')
const photoStore = require('./photo-store.js')

const KEY = 'jianleme_data'
const BASE_RECORD = { steps: 0, trainingKcal: 0, dietKcal: 0 }

let cache = null // 内存缓存:一次刷新会连读几十次,避免反复全量读存储

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const DEFAULT = {
  version: '0.0.1',
  profile: {
    nickname: '健身人',
    onboarded: false,
    gender: 'male',
    heightCm: 170,
    weightKg: 65,
    age: 28,
    activityLevel: 'light',
    goal: 'maintain',
    level: 'beginner'
  },
  weightHistory: [],
  dailyRecords: {},
  trainingLogs: [],
  dietLogs: [],
  customExercises: {},
  customFoods: []
}

function readStorage() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch (e) { return null }
}
function writeStorage(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// 逐条补齐每日记录基础字段,兼容老数据缺字段
function normalizeRecords(records) {
  const out = {}
  for (const [date, rec] of Object.entries(records || {})) {
    out[date] = { ...BASE_RECORD, ...rec }
  }
  return out
}

function load() {
  if (cache) return cache
  let merged = null
  try {
    const raw = readStorage()
    if (raw) {
      merged = { ...DEFAULT, ...raw }
      merged.profile = { ...DEFAULT.profile, ...raw.profile }
      merged.dailyRecords = normalizeRecords(raw.dailyRecords)
      merged.trainingLogs = raw.trainingLogs || []
      merged.dietLogs = raw.dietLogs || []
    }
  } catch (e) { /* ignore */ }
  cache = merged || JSON.parse(JSON.stringify(DEFAULT))
  return cache
}

function save(data) {
  writeStorage(data)
  cache = data
}

// 测试用:清空内存缓存
function _resetCache() { cache = null }

// 清空全部数据(含照片库),回到全新状态
function resetAll() {
  try { localStorage.removeItem(KEY) } catch (e) {}
  try { photoStore.clear() } catch (e) {}
  cache = null
}

// 删除饮食照片(仅限 /photos/ 逻辑路径;IDB 异步删除,fire-and-forget)
function deletePhotoFile(photoPath) {
  if (!photoPath || !photoPath.includes('/photos/')) return
  try { photoStore.remove(photoPath) } catch (e) {}
}

// === Profile ===
function getProfile() { return load().profile }
function setProfile(partial) {
  const data = load()
  const oldWeight = data.profile.weightKg
  data.profile = { ...data.profile, ...partial }
  if (partial.weightKg !== undefined && partial.weightKg !== oldWeight) {
    if (!data.weightHistory) data.weightHistory = []
    data.weightHistory.push({ date: todayStr(), weightKg: partial.weightKg })
  }
  save(data)
  return data.profile
}

// === Daily record ===
function getTodayRecord() {
  const data = load()
  const today = todayStr()
  if (!data.dailyRecords[today]) {
    data.dailyRecords[today] = { ...BASE_RECORD }
    save(data)
  }
  return data.dailyRecords[today]
}

function getRecordByDate(date) {
  const data = load()
  return data.dailyRecords[date] || { ...BASE_RECORD }
}

function updateTodayRecord(partial) {
  const data = load()
  const today = todayStr()
  if (!data.dailyRecords[today]) {
    data.dailyRecords[today] = { ...BASE_RECORD }
  }
  Object.assign(data.dailyRecords[today], partial)
  save(data)
  return data.dailyRecords[today]
}

// === Steps ===
function setSteps(steps) { return updateTodayRecord({ steps }) }
function getSteps() { return getTodayRecord().steps || 0 }

// === Training ===
function addTraining(exercises, recordTime) {
  const data = load()
  const today = todayStr()
  const profile = data.profile
  const exercisesWithKcal = exercises.map(ex => ({
    ...ex,
    kcal: calc.calcExerciseCalories(ex.key, profile.weightKg, ex.sets, ex.reps, ex.met)
  }))
  const totalKcal = exercisesWithKcal.reduce((sum, ex) => sum + ex.kcal, 0)
  const record = { date: today, exercises: exercisesWithKcal, totalKcal, ts: Date.now(), time: recordTime || '' }
  data.trainingLogs.unshift(record)
  if (!data.dailyRecords[today]) data.dailyRecords[today] = { ...BASE_RECORD }
  data.dailyRecords[today].trainingKcal = (data.dailyRecords[today].trainingKcal || 0) + totalKcal
  save(data)
  return { record, totalKcal }
}

function getTodayTrainings() {
  const data = load()
  const today = todayStr()
  return data.trainingLogs.filter(t => t.date === today)
}

function getAllTrainings() { return load().trainingLogs }

// === Diet ===
function addDietEntry(items, photoPath, recordTime, mealType) {
  const data = load()
  const today = todayStr()
  const totalKcal = items.reduce((sum, item) => sum + item.kcal, 0)
  const record = { date: today, items, photoPath: photoPath || '', totalKcal, ts: Date.now(), time: recordTime || '', mealType: mealType || '' }
  data.dietLogs.unshift(record)
  if (!data.dailyRecords[today]) data.dailyRecords[today] = { ...BASE_RECORD }
  data.dailyRecords[today].dietKcal = (data.dailyRecords[today].dietKcal || 0) + totalKcal
  save(data)
  return { record, totalKcal }
}

function getTodayDietEntries() {
  const data = load()
  const today = todayStr()
  return data.dietLogs.filter(d => d.date === today)
}

function getAllDietEntries() { return load().dietLogs }

function deleteDietEntry(ts) {
  const data = load()
  const idx = data.dietLogs.findIndex(d => d.ts === ts)
  if (idx === -1) return false
  const entry = data.dietLogs[idx]
  if (data.dailyRecords[entry.date]) {
    data.dailyRecords[entry.date].dietKcal = Math.max(0, (data.dailyRecords[entry.date].dietKcal || 0) - entry.totalKcal)
  }
  deletePhotoFile(entry.photoPath)
  data.dietLogs.splice(idx, 1)
  save(data)
  return true
}

// === Daily Summary ===
function getDailySummary() {
  const data = load()
  const profile = data.profile
  const record = getTodayRecord()
  const bmr = calc.calcBMR(profile.gender, profile.weightKg, profile.heightCm, profile.age)
  const bmrNow = calc.calcBMRNow(bmr)
  const tdee = calc.calcTDEE(bmr, profile.activityLevel)
  const todayWeight = getWeightOnDate(todayStr()) || profile.weightKg
  const stepKcal = calc.calcStepCalories(record.steps, todayWeight)
  const totalOut = tdee + record.trainingKcal + stepKcal
  const totalIn = record.dietKcal
  const deficit = totalOut - totalIn
  return {
    bmr, bmrNow, tdee, stepKcal,
    steps: record.steps,
    trainingKcal: record.trainingKcal,
    dietKcal: totalIn,
    totalOut, totalIn, deficit,
    deficitLabel: deficit > 0 ? '热量缺口' : '热量盈余',
    date: todayStr()
  }
}

function getYesterdayRecord() {
  const data = load()
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const yest = `${d.getFullYear()}-${m}-${day}`
  return data.dailyRecords[yest] || { ...BASE_RECORD }
}

function getHistory() {
  const data = load()
  const profile = data.profile
  const today = todayStr()
  const dates = Object.keys(data.dailyRecords).filter(d => d !== today).sort().reverse()
  return dates.map(date => {
    const record = data.dailyRecords[date]
    const weightKg = getWeightOnDate(date) || profile.weightKg
    const bmr = calc.calcBMR(profile.gender, weightKg, profile.heightCm, profile.age)
    const tdee = calc.calcTDEE(bmr, profile.activityLevel)
    const steps = record.steps || 0
    const trainingKcal = record.trainingKcal || 0
    const dietKcal = record.dietKcal || 0
    const stepKcal = calc.calcStepCalories(steps, weightKg)
    const totalOut = tdee + trainingKcal + stepKcal
    const totalIn = dietKcal
    const scoreData = getScoreForDate(date)
    return { date, steps, trainingKcal, dietKcal, stepKcal, totalOut, totalIn, deficit: totalOut - totalIn, score: scoreData.totalScore }
  })
}

function getTrainingsByDate(date) { return load().trainingLogs.filter(t => t.date === date) }
function getDietByDate(date) { return load().dietLogs.filter(d => d.date === date) }

function updateTrainingExercise(ts, exIdx, updates) {
  const data = load()
  const entry = data.trainingLogs.find(t => t.ts === ts)
  if (!entry) return false
  const ex = entry.exercises[exIdx]
  if (!ex) return false
  const oldKcal = ex.kcal
  Object.assign(ex, updates)
  const profile = data.profile
  ex.kcal = calc.calcExerciseCalories(ex.key, profile.weightKg, ex.sets, ex.reps, ex.met)
  entry.totalKcal = entry.totalKcal - oldKcal + ex.kcal
  if (data.dailyRecords[entry.date]) {
    data.dailyRecords[entry.date].trainingKcal = Math.max(0, (data.dailyRecords[entry.date].trainingKcal || 0) - oldKcal + ex.kcal)
  }
  save(data)
  return true
}

function deleteTrainingEntry(ts) {
  const data = load()
  const idx = data.trainingLogs.findIndex(t => t.ts === ts)
  if (idx === -1) return false
  const entry = data.trainingLogs[idx]
  if (data.dailyRecords[entry.date]) {
    data.dailyRecords[entry.date].trainingKcal = Math.max(0, (data.dailyRecords[entry.date].trainingKcal || 0) - entry.totalKcal)
  }
  data.trainingLogs.splice(idx, 1)
  save(data)
  return true
}

function updateDietEntry(ts, items) {
  const data = load()
  const idx = data.dietLogs.findIndex(d => d.ts === ts)
  if (idx === -1) return false
  const oldEntry = data.dietLogs[idx]
  const newTotalKcal = items.reduce((sum, item) => sum + item.kcal, 0)
  if (data.dailyRecords[oldEntry.date]) {
    data.dailyRecords[oldEntry.date].dietKcal = Math.max(0, (data.dailyRecords[oldEntry.date].dietKcal || 0) - oldEntry.totalKcal + newTotalKcal)
  }
  data.dietLogs[idx] = { ...oldEntry, items, totalKcal: newTotalKcal }
  save(data)
  return true
}

function updateDietEntryFull(ts, items, photoPath, recordTime, mealType) {
  const data = load()
  const idx = data.dietLogs.findIndex(d => d.ts === ts)
  if (idx === -1) return false
  const oldEntry = data.dietLogs[idx]
  const newTotalKcal = items.reduce((sum, item) => sum + item.kcal, 0)
  if (data.dailyRecords[oldEntry.date]) {
    data.dailyRecords[oldEntry.date].dietKcal = Math.max(0, (data.dailyRecords[oldEntry.date].dietKcal || 0) - oldEntry.totalKcal + newTotalKcal)
  }
  data.dietLogs[idx] = { ...oldEntry, items, photoPath: photoPath || oldEntry.photoPath, time: recordTime || oldEntry.time, totalKcal: newTotalKcal, mealType: mealType !== undefined ? mealType : oldEntry.mealType || '' }
  save(data)
  return true
}

function updateTrainingEntry(ts, exercises, recordTime) {
  const data = load()
  const idx = data.trainingLogs.findIndex(t => t.ts === ts)
  if (idx === -1) return false
  const oldEntry = data.trainingLogs[idx]
  const profile = data.profile
  const totalKcal = exercises.reduce((sum, ex) => {
    return sum + calc.calcExerciseCalories(ex.key, profile.weightKg, ex.sets, ex.reps, ex.met)
  }, 0)
  if (data.dailyRecords[oldEntry.date]) {
    data.dailyRecords[oldEntry.date].trainingKcal = Math.max(0, (data.dailyRecords[oldEntry.date].trainingKcal || 0) - oldEntry.totalKcal + totalKcal)
  }
  data.trainingLogs[idx] = { ...oldEntry, exercises, totalKcal, time: recordTime || oldEntry.time }
  save(data)
  return true
}

// === Custom Exercises ===
function getCustomExercises() { return load().customExercises || {} }
function addCustomExercise(cat, name, met) {
  const data = load()
  if (!data.customExercises) data.customExercises = {}
  if (!data.customExercises[cat]) data.customExercises[cat] = []
  const key = 'cust_' + Date.now()
  data.customExercises[cat].push({ key, name, met })
  save(data)
  return key
}
function removeCustomExercise(cat, key) {
  const data = load()
  if (!data.customExercises || !data.customExercises[cat]) return false
  data.customExercises[cat] = data.customExercises[cat].filter(e => e.key !== key)
  save(data)
  return true
}

// === Custom Foods ===
function getCustomFoods() { return load().customFoods || [] }
function addCustomFood(name, kcalPer100) {
  const data = load()
  if (!data.customFoods) data.customFoods = []
  if (data.customFoods.find(f => f.name === name)) return false
  data.customFoods.push({ name, kcalPer100 })
  save(data)
  return true
}
function removeCustomFood(name) {
  const data = load()
  if (!data.customFoods) return false
  data.customFoods = data.customFoods.filter(f => f.name !== name)
  save(data)
  return true
}

// === Version & Weight ===
function getVersion() { return load().version || '0.0.0' }
function getWeightHistory() { return load().weightHistory || [] }
function deleteWeightEntry(dateStr) {
  const data = load()
  if (!data.weightHistory) return false
  const idx = data.weightHistory.findIndex(w => w.date === dateStr)
  if (idx === -1) return false
  data.weightHistory.splice(idx, 1)
  save(data)
  return true
}
function getLastWeightDate() {
  const history = getWeightHistory()
  if (history.length === 0) return null
  return history[history.length - 1].date
}
function getWeightOnDate(dateStr) {
  const history = getWeightHistory()
  if (history.length === 0) return null
  let weight = null
  for (let i = 0; i < history.length; i++) {
    if (history[i].date <= dateStr) weight = history[i].weightKg
    else break
  }
  return weight
}

// === Score for any date ===
function getScoreForDate(dateStr) {
  const data = load()
  const profile = data.profile
  const allRecords = data.dailyRecords
  const todayRecord = allRecords[dateStr] || { ...BASE_RECORD }
  const todayTrainings = data.trainingLogs.filter(t => t.date === dateStr)
  const todayDiets = data.dietLogs.filter(d => d.date === dateStr)
  const pastDates = Object.keys(allRecords).filter(d => d < dateStr).sort()
  const recentDates = pastDates.slice(-14)
  const history = recentDates.map(d => allRecords[d] || { steps:0, trainingKcal:0, dietKcal:0 })
  const trainingHistory = data.trainingLogs.filter(t => t.date < dateStr)
  const input = {
    profile, today: dateStr, todayRecord, todayTrainings, todayDiets,
    history, trainingHistory,
    weightHistory: data.weightHistory || [],
    allDailyRecords: data.dailyRecords,
    firstRecordDate: pastDates.length > 0 ? pastDates[0] : null
  }
  return score.calculateScore(input)
}

// === Sleep ===
function updateSleep(date, sleepData) {
  if (date > todayStr()) return false
  const data = load()
  if (!data.dailyRecords[date]) {
    data.dailyRecords[date] = { ...BASE_RECORD }
  }
  data.dailyRecords[date].sleep = sleepData
  save(data)
  return true
}

function deleteSleep(date) {
  const data = load()
  if (!data.dailyRecords[date] || !data.dailyRecords[date].sleep) return false
  delete data.dailyRecords[date].sleep
  const r = data.dailyRecords[date]
  if (!r.steps && !r.trainingKcal && !r.dietKcal) {
    delete data.dailyRecords[date]
  }
  save(data)
  return true
}

// === Frequent Foods ===
function getFrequentFoods(limit = 6) {
  const data = load()
  const countMap = {}
  data.dietLogs.forEach(log => {
    (log.items || []).forEach(item => {
      countMap[item.food] = (countMap[item.food] || 0) + 1
    })
  })
  const top = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, limit)
  // 自定义食物作为兜底:库内查不到也能显示热量
  const customMap = {}
  ;(data.customFoods || []).forEach(f => { customMap[f.name] = f.kcalPer100 })
  return top.map(([foodName]) => {
    let kcalPer100 = customMap[foodName]
    const entry = foods.getFoodByName(foodName)
    if (entry) kcalPer100 = entry.kcal
    else if (kcalPer100 === undefined) {
      const serving = foods.getQuickServing(foodName)
      if (serving) kcalPer100 = (foods.getFoodByName(serving.food) || {}).kcal || 0
    }
    return { name: foodName, kcalPer100: kcalPer100 || 0 }
  }).filter(f => f.kcalPer100 > 0)
}

module.exports = {
  load, save, todayStr, getRecordByDate, resetAll, _resetCache, deletePhotoFile,
  getProfile, setProfile,
  getTodayRecord, updateTodayRecord,
  setSteps, getSteps,
  addTraining, getTodayTrainings, getAllTrainings, getTrainingsByDate, updateTrainingExercise, deleteTrainingEntry, updateTrainingEntry,
  addDietEntry, getTodayDietEntries, getAllDietEntries, getDietByDate, deleteDietEntry, updateDietEntry, updateDietEntryFull,
  getDailySummary, getYesterdayRecord, getHistory,
  getCustomExercises, addCustomExercise, removeCustomExercise,
  getCustomFoods, addCustomFood, removeCustomFood,
  getVersion, getWeightHistory, deleteWeightEntry, getLastWeightDate, getWeightOnDate, getFrequentFoods,
  getScoreForDate,
  updateSleep, deleteSleep
}

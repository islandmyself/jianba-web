/* 自动生成 by build.js — 勿手改,源文件在 js/ 下 */
(function () {
  const __mods = {}
  function __define(name, fn) { const m = { exports: {} }; fn(m, m.exports); __mods[name] = m.exports }
  function __require(name) { return __mods[String(name).replace(/^\.\//, '').replace(/\.js$/, '')] }
  window.__jianba = __require

__define('calc', function (module, exports) {
// BMR & TDEE — Mifflin-St Jeor equation
function calcBMR(gender, weightKg, heightCm, age) {
  if (!weightKg || !heightCm || !age) return 0
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

function calcTDEE(bmr, activityLevel) {
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, intense: 1.9 }
  return Math.round(bmr * (factors[activityLevel] || 1.2))
}

// Step calories: ~0.04 kcal per step (avg for 60kg person; scales with weight)
function calcStepCalories(steps, weightKg) {
  if (!steps || !weightKg) return 0
  const perStep = (weightKg / 60) * 0.04
  return Math.round(steps * perStep)
}

// Exercise calories using MET values
// MET lookup for common exercises
const EXERCISE_MET = {
  squat: 5.0, lunge: 5.0, deadlift: 6.0, bench_press: 6.0,
  overhead_press: 6.0, pull_up: 8.0, row: 6.0, bicep_curl: 3.0,
  tricep_extension: 3.0, lateral_raise: 3.0, plank: 3.5,
  crunch: 4.0, leg_raise: 4.0, russian_twist: 4.0,
  push_up: 8.0, burpee: 8.0, jump_squat: 8.0,
  running: 8.5, cycling: 7.5, swimming: 7.0, jump_rope: 10.0,
  walking: 3.5, yoga: 2.5, stretching: 2.0
}

// Calories = MET × weight(kg) × duration(hours)
// Duration estimated from: sets × reps × 3s per rep / 3600
function calcExerciseCalories(exerciseKey, weightKg, sets, reps, customMet) {
  const met = customMet || EXERCISE_MET[exerciseKey] || 5.0
  // ~3s per rep, plus 30s rest between sets
  const workSec = sets * reps * 3
  const restSec = (sets - 1) * 30
  const totalHours = (workSec + restSec) / 3600
  return Math.round(met * weightKg * totalHours)
}

// Exercise name mapping for display
const EXERCISE_NAMES = {
  squat: '深蹲', lunge: '弓步蹲', deadlift: '硬拉', bench_press: '卧推',
  overhead_press: '推举', pull_up: '引体向上', row: '划船',
  bicep_curl: '二头弯举', tricep_extension: '三头臂屈伸',
  lateral_raise: '侧平举', plank: '平板支撑', crunch: '卷腹',
  leg_raise: '悬垂举腿', russian_twist: '俄转', push_up: '俯卧撑',
  burpee: '波比跳', jump_squat: '深蹲跳', running: '跑步',
  cycling: '骑行', swimming: '游泳', jump_rope: '跳绳',
  walking: '快走', yoga: '瑜伽', stretching: '拉伸'
}

const EXERCISE_CATEGORIES = {
  chest: { label: '胸部', keys: ['bench_press', 'push_up'] },
  back: { label: '背部', keys: ['pull_up', 'row', 'deadlift'] },
  legs: { label: '腿部', keys: ['squat', 'lunge', 'jump_squat'] },
  shoulders: { label: '肩部', keys: ['overhead_press', 'lateral_raise'] },
  arms: { label: '手臂', keys: ['bicep_curl', 'tricep_extension'] },
  core: { label: '核心', keys: ['plank', 'crunch', 'leg_raise', 'russian_twist'] },
  cardio: { label: '有氧', keys: ['running', 'cycling', 'swimming', 'jump_rope', 'walking', 'burpee'] },
  other: { label: '其他', keys: ['yoga', 'stretching'] }
}

// Macro calculation based on goal
function calcMacros(tdee, goal) {
  // goal: 'lose' | 'maintain' | 'gain'
  let calorieTarget, proteinPct, fatPct, carbPct
  switch (goal) {
    case 'lose':
      calorieTarget = tdee - 400
      proteinPct = 0.4; fatPct = 0.3; carbPct = 0.3
      break
    case 'gain':
      calorieTarget = tdee + 300
      proteinPct = 0.35; fatPct = 0.25; carbPct = 0.4
      break
    default:
      calorieTarget = tdee
      proteinPct = 0.3; fatPct = 0.3; carbPct = 0.4
  }
  return {
    calories: calorieTarget,
    protein: Math.round((calorieTarget * proteinPct) / 4),
    fat: Math.round((calorieTarget * fatPct) / 9),
    carbs: Math.round((calorieTarget * carbPct) / 4)
  }
}

// Time-proportional BMR using circadian rhythm model
// Based on Zitting et al. 2018, Current Biology: REE varies ~10% across day
// Lowest during late night (sleep), highest in late afternoon
const CIRCADIAN = [
  0.85, 0.85, 0.84, 0.84, 0.85, 0.87, // 0:00-6:00 sleep
  0.90, 0.94, 0.97, 1.00, 1.03, 1.05, // 6:00-12:00 morning
  1.07, 1.08, 1.08, 1.07, 1.05, 1.03, // 12:00-18:00 afternoon
  1.00, 0.97, 0.94, 0.91, 0.88, 0.86  // 18:00-24:00 evening
]

function calcBMRNow(bmr) {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const fraction = minutes / 60

  let cumulative = 0
  for (let h = 0; h < hours; h++) cumulative += CIRCADIAN[h]
  cumulative += CIRCADIAN[hours] * fraction

  const total = CIRCADIAN.reduce((s, v) => s + v, 0)
  return Math.round(bmr * cumulative / total)
}

function getBMRByHour(bmr) {
  const total = CIRCADIAN.reduce((s, v) => s + v, 0)
  return CIRCADIAN.map(m => Math.round(bmr * m / total))
}

module.exports = {
  calcBMR, calcBMRNow, calcTDEE, calcStepCalories, calcExerciseCalories, calcMacros,
  EXERCISE_MET, EXERCISE_NAMES, EXERCISE_CATEGORIES, getBMRByHour
}

});

__define('score', function (module, exports) {
const calc = __require('./calc.js')
const foods = __require('./foods.js')

const WEIGHTS = {
  strength:  { calorie:20, training:33, diet:23, sleep:12, habit:12 },
  cardio:    { calorie:18, training:28, diet:18, sleep:14, habit:22 },
  diet_only: { calorie:35, training:0,  diet:28, sleep:17, habit:20 },
  hybrid:    { calorie:20, training:27, diet:23, sleep:15, habit:15 }
}

const CARDIO_KEYS = ['running','cycling','swimming','jump_rope','walking','burpee']
const JUNK_FOOD = ['薯片','可乐','奶茶','炸鸡翅','方便面','巧克力','饼干','啤酒','油条','培根','披萨','薯条','汉堡']
const VEGGIE_CATS = ['蔬菜','水果']
const HIGH_PROTEIN_CATS = ['肉类','水产','蛋奶']

// === 睡眠时长评分表(顺序匹配) ===
const SLEEP_DUR_BANDS = [
  { test: d => d >= 7 && d <= 8, score: 70 },
  { test: d => (d >= 6.5 && d < 7) || (d > 8 && d <= 8.5), score: 55 },
  { test: d => (d >= 6 && d < 6.5) || (d > 8.5 && d <= 9), score: 35 },
  { test: d => (d >= 5 && d < 6) || (d > 9 && d <= 10), score: 20 }
]

// === 睡眠文案表(按分数档位,顺序匹配) ===
const SLEEP_LABELS = [
  { min: 80, text: conScore => conScore >= 15 ? '作息规律，睡眠质量好' : '睡眠质量好，身体恢复充分' },
  { min: 60, text: conScore => conScore < 5 ? '入睡时间慢慢固定下来，身体会感谢你' : '睡眠时长还行，早半小时睡会更好' },
  { min: 40, text: () => '最近睡得有点少，恢复会受影响' },
  { min: 1, text: () => '身体需要休息来变强，今天早点睡吧' }
]

// === 总结文案规则表(每组对应原 if/else-if 链:组内互斥取第一条命中,组间全部执行) ===
const SUMMARY_GROUPS = [
  [ // 睡眠健康警告
    { test: r => r.consecutivePoorSleep >= 3, text: () => '最近睡得比较少，这周找一天早点睡，身体会感谢你' },
    { test: r => r.sleep && r.sleep.level === 'low' && r.sleep.label, text: r => r.sleep.label }
  ],
  [ // 热量
    { test: r => r.calorie.level === 'high',
      text: r => r.profile.goal === 'lose' ? `热量缺口${r.calorie.deficit}kcal，在减脂目标区间`
        : r.profile.goal === 'gain' ? `热量盈余${-r.calorie.deficit}kcal，在增肌目标区间`
        : `热量平衡保持得好，±${Math.abs(r.calorie.deficit)}kcal` },
    { test: r => r.calorie.level === 'mid', text: () => '热量控制接近目标' },
    { test: r => r.calorie.level === 'low' && r.calorie.label, text: r => r.calorie.label }
  ],
  [ // 训练
    { test: r => r.training.level === 'rest', text: r => r.training.label },
    { test: r => r.training.level === 'high' && r.training.todayKcal !== undefined, text: r => `训练消耗${r.training.todayKcal}kcal，状态不错` },
    { test: r => r.training.level === 'high', text: r => r.training.label },
    { test: r => r.training.level === 'mid', text: r => r.training.label || '训练量正常' },
    { test: r => r.training.level === 'low' && r.training.label, text: r => r.training.label }
  ],
  [ // 饮食
    { test: r => r.diet.level === 'high', text: r => r.diet.label },
    { test: r => r.diet.level === 'mid' && r.diet.label, text: r => r.diet.label }
  ],
  [ // 睡眠质量
    { test: r => r.sleep && r.sleep.level === 'high' && r.consecutivePoorSleep < 3, text: r => r.sleep.label },
    { test: r => r.sleep && r.sleep.level === 'mid' && r.consecutivePoorSleep < 3 && r.sleep.label, text: r => r.sleep.label }
  ],
  [ // 习惯
    { test: r => r.habit.level === 'high' || (r.habit.level === 'mid' && r.habit.label), text: r => r.habit.label }
  ],
  [ // 三线在线
    { test: r => r.sleep && r.sleep.pct >= 80 && r.training.pct >= 80 && r.diet.pct >= 80, text: () => '睡眠、训练、饮食都在线！' }
  ]
]

// === 交叉影响规则组(组内互斥取第一条命中,组间全部执行) ===
const CROSS_GROUPS = [
  [ // 睡眠状态 → 训练
    { test: c => c.sleep.level !== 'silent' && c.userType !== 'diet_only' && c.sleep.pct >= 80,
      apply: c => { c.training.pct = Math.min(100, c.training.pct + 2); if (c.training.level !== 'rest') c.crossEffects.push('睡眠充足，恢复充分') } },
    { test: c => c.sleep.level !== 'silent' && c.userType !== 'diet_only' && c.sleep.pct < 40,
      apply: c => {
        const at = avg(c.history.slice(-7).map(d => d.trainingKcal || 0).filter(k => k > 0))
        if (at > 0 && (c.todayRecord.trainingKcal || 0) > at * 1.5) { c.training.level = 'rest'; c.training.label = '昨晚睡得少，今天轻松练就好。优先补觉' }
        else if (c.training.level !== 'silent') c.training.label = (c.training.label || '') + '。睡得少的时候，练得轻是合理的'
      } },
    { test: c => c.sleep.level !== 'silent' && c.userType !== 'diet_only' && c.sleep.pct < 60,
      apply: c => { if (c.training.level !== 'silent' && c.training.level !== 'rest') c.training.label = (c.training.label || '') + '。昨晚睡得少，练得轻是合理的' } }
  ],
  [ // 昨日睡眠不足
    { test: c => c.yestSleepH !== null && c.yestSleepH < 6 && c.userType !== 'diet_only',
      apply: c => {
        const at2 = avg(c.history.slice(-7).map(d => d.trainingKcal || 0).filter(k => k > 0))
        if (at2 > 0 && (c.todayRecord.trainingKcal || 0) > at2 * 1.5) { c.training.level = 'rest'; c.training.label = '昨天没睡好，今天轻松一点，恢复比训练更重要'; c.crossEffects.push('昨日睡眠不足+高强度训练') }
      } }
  ],
  [ // 睡眠不足 → 放宽热量目标
    { test: c => c.sleep.level !== 'silent' && c.sleep.pct < 60 && c.calorie.level !== 'silent',
      apply: c => { if (c.sleep.pct < 40 && c.calorie.label) c.calorie.label = c.calorie.label + '。睡眠不足时代谢会变慢，热量目标已放宽' } }
  ],
  [ // 深夜进食/睡不足吃垃圾食品
    { test: c => c.todaySleep && c.todaySleep.bedTime,
      apply: c => {
        const bh = parseInt(c.todaySleep.bedTime.split(':')[0])
        if (bh >= 0 && bh < 6 && c.todayDiets.some(d => d.mealType === 'snack') && c.diet.level !== 'silent') { c.diet.pct = Math.max(0, c.diet.pct - 8); c.crossEffects.push('深夜进食影响睡眠') }
        if (c.todaySleep.durationHours < 6 && c.diet.level !== 'silent') {
          const junkC = c.todayDiets.flatMap(d => d.items || []).filter(it => JUNK_FOOD.includes(it.food)).length
          if (junkC >= 2 && c.diet.label) c.diet.label = c.diet.label + '。睡眠不足容易想吃高热量食物'
        }
      } }
  ],
  [ // 连续睡眠不足 → 扣习惯分
    { test: c => c.consecPoorSleep >= 3,
      apply: c => { c.habit.pct = Math.max(0, c.habit.pct - 10); c.crossEffects.push('连续睡得少，身体需要休息来恢复') } }
  ],
  [ // 昨天睡得好 + 今天没练
    { test: c => c.yestSleepH !== null && c.yestSleepH >= 8 && (c.todayRecord.trainingKcal || 0) === 0,
      apply: c => { if (c.training.level === 'low' && (c.training.label || '').includes('没练')) { c.training.label = '睡饱了就是最好的训练准备'; c.training.level = 'mid'; c.training.pct = Math.max(c.training.pct, 30) } } }
  ]
]

function avg(arr) { if (!arr.length) return 0; return arr.reduce((a,b)=>a+b,0)/arr.length }

function dayOfWeek(dateStr) { return new Date(dateStr+'T00:00:00').getDay() }

// 本地日期格式化(勿用 toISOString().slice(0,10)——UTC+8 会偏移一天)
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function daysBetween(d1,d2) {
  return Math.round((new Date(d2+'T00:00:00') - new Date(d1+'T00:00:00'))/86400000)
}

function getWeightOnDate(weightHistory, dateStr, fallback) {
  let w = null
  for (let e of weightHistory) { if (e.date<=dateStr) w=e.weightKg; else break }
  return w || fallback
}

// === 分型 ===
function determineUserType(history, trainingHistory) {
  if (!trainingHistory) trainingHistory = []
  const recent14 = history.slice(-14)
  const hasStrength = trainingHistory.filter(t =>
    (t.exercises||[]).some(e => (e.sets||0)>0 && (e.reps||0)>0 && !CARDIO_KEYS.includes(e.key))
  ).length >= 4
  const hasCardio = trainingHistory.filter(t =>
    (t.exercises||[]).some(e => CARDIO_KEYS.includes(e.key))
  ).length >= 1
  const avgSteps = avg(recent14.map(d=>d.steps||0))
  const hasDiet = recent14.some(d=>(d.dietKcal||0)>0)
  const hasAnyTraining = trainingHistory.length >= 1

  if (!hasAnyTraining && !hasDiet) return 'hybrid'
  if (hasStrength && (hasCardio || avgSteps>=8000)) return 'hybrid'
  if (hasStrength) return 'strength'
  if (hasCardio || avgSteps>=8000) return 'cardio'
  if (hasDiet && !hasAnyTraining && avgSteps<5000) return 'diet_only'
  return 'hybrid'
}

// === 数据深度（替代冷启动） ===
// phase: 'early'(1-2天) | 'building'(3-6天) | 'mature'(7天+)
function getDataDepth(allDailyRecords, today) {
  const dates = Object.keys(allDailyRecords).filter(d=>{
    const r=allDailyRecords[d]; return (r.steps||0)>0||(r.trainingKcal||0)>0||(r.dietKcal||0)>0||(r.sleep&&r.sleep.durationHours>0)
  }).sort()
  if (!dates.length) return { depth: 0, days: 0, phase: 'early' }
  const span = daysBetween(dates[0], today)
  const days = dates.length
  if (span >= 7 && days >= 3) return { depth: Math.max(span, days), days, phase: 'mature' }
  if (span >= 3 || days >= 3) return { depth: Math.max(span + 1, days), days, phase: 'building' }
  return { depth: Math.max(span + 1, days), days, phase: 'early' }
}

// === 作息表 ===
function buildDayOfWeekAvg(allDailyRecords, trainingLogs) {
  const table = {}
  for (let i=0;i<7;i++) table[i]={count:0,sumSteps:0,sumTrainingKcal:0}
  for (let [date,rec] of Object.entries(allDailyRecords)) {
    const dow = dayOfWeek(date)
    if ((rec.steps||0)>0||(rec.trainingKcal||0)>0||(rec.dietKcal||0)>0) {
      table[dow].count++; table[dow].sumSteps+=(rec.steps||0); table[dow].sumTrainingKcal+=(rec.trainingKcal||0)
    }
  }
  return table
}

function getDayOfWeekBaseline(table, dow, field, fallbackAvg) {
  const e = table[dow]
  if (e && e.count>=2) return field==='steps'?e.sumSteps/e.count:e.sumTrainingKcal/e.count
  return fallbackAvg
}

// === 恢复感知 ===
function getTrainingKcalForDate(trainingLogs, date) {
  return trainingLogs.filter(t=>t.date===date).reduce((s,t)=>s+(t.totalKcal||0),0)
}

function getTrainingKcalArray(trainingLogs, nDays, endDate) {
  const result = []
  for (let i=nDays-1;i>=0;i--) {
    const d=new Date(endDate+'T00:00:00'); d.setDate(d.getDate()-i)
    result.push(getTrainingKcalForDate(trainingLogs, fmtDate(d)))
  }
  return result
}

function countConsecutiveNoTraining(trainingLogs, endDate) {
  let count=0
  for (let i=1;i<=14;i++) {
    const d=new Date(endDate+'T00:00:00'); d.setDate(d.getDate()-i)
    if (getTrainingKcalForDate(trainingLogs,fmtDate(d))===0) count++; else break
  }
  return count
}

function checkRecovery(trainingLogs, today, userType) {
  if (userType==='diet_only') return 'normal'
  const yest = new Date(today+'T00:00:00'); yest.setDate(yest.getDate()-1)
  const yesterdayKcal = getTrainingKcalForDate(trainingLogs, fmtDate(yest))
  const recent7 = getTrainingKcalArray(trainingLogs,7,today)
  const avg7 = avg(recent7.filter(k=>k>0)) || 1
  const todayKcal = getTrainingKcalForDate(trainingLogs, today)

  const last3 = getTrainingKcalArray(trainingLogs,3,today)
  if (last3.length===3 && last3.every(k=>k>avg7*1.5)) return 'forced_rest'
  if (yesterdayKcal>avg7*1.5) {
    if (todayKcal===0) return 'smart_rest'
    if (todayKcal<avg7*0.8) return 'light_day'
  }
  if (countConsecutiveNoTraining(trainingLogs, today)>=3) return 'inactive_3plus'
  return 'normal'
}

// === 6.1 热量管理 ===
function scoreCalorie(profile, todayRecord, history, weightHistory, today) {
  const goal=profile.goal, intake=todayRecord.dietKcal||0
  const bmr=calc.calcBMR(profile.gender,profile.weightKg,profile.heightCm,profile.age)
  const todayW=getWeightOnDate(weightHistory,today,profile.weightKg)
  const stepKcal=calc.calcStepCalories(todayRecord.steps||0,todayW)
  const totalOut=calc.calcTDEE(bmr,profile.activityLevel)+(todayRecord.trainingKcal||0)+stepKcal
  const deficit=totalOut-intake

  if (intake===0) return { pct:0,level:'silent',label:'',deficit,totalOut,bmr }

  const histDeficits=history.map(d=>{
    const w=getWeightOnDate(weightHistory,d.date,profile.weightKg)
    return (calc.calcTDEE(bmr,profile.activityLevel)+(d.trainingKcal||0)+calc.calcStepCalories(d.steps||0,w))-(d.dietKcal||0)
  }).filter(d=>d!==0)
  const avgDeficit=avg(histDeficits)
  const hasHistory = histDeficits.length >= 3

  let pct, label=''
  if (goal==='maintain') {
    const a=Math.abs(deficit); pct=a<=150?100:a<=300?60:30
  } else if (!hasHistory) {
    // Early phase: absolute target ranges
    const sign=goal==='lose'?1:-1, dir=(deficit*sign)
    if (goal==='lose') pct=deficit>=300&&deficit<=500?100:dir>0?60:30
    else pct=deficit>=-400&&deficit<=-200?100:dir>0?60:30
  } else {
    const sign=goal==='lose'?1:-1, sameDir=(deficit*sign)>0
    const lo=Math.min(avgDeficit*0.8,avgDeficit*1.2),hi=Math.max(avgDeficit*0.8,avgDeficit*1.2)
    const inRange=deficit>=lo&&deficit<=hi
    pct=inRange?100:sameDir?60:30
  }
  const a=Math.abs(deficit)
  if (a>1000){pct=Math.min(pct,50);label='吃得太少了，身体需要能量来变强'}
  else if (a>800){pct=Math.min(pct,70);label='可以适当多吃一点'}
  else if (pct>=80)label=goal==='maintain'?'热量平衡保持得好':'热量缺口在目标区间'
  else if (pct>=60)label='距离目标差一点点，微调一下就好'
  if (!hasHistory && pct>=80) label = goal==='lose'?'减脂目标区间内':'增肌目标区间内'
  return {pct,level:pct>=80?'high':pct>=60?'mid':'low',label,deficit,totalOut,bmr}
}

// === 6.2 训练 ===
function scoreTraining(profile, todayRecord, history, trainingLogs, weightHistory, today, userType, dowAvgTable) {
  const todayKcal=todayRecord.trainingKcal||0, dow=dayOfWeek(today)
  const recent7=history.slice(-7).map(d=>d.trainingKcal||0)
  const trainingDays=recent7.filter(k=>k>0)
  const baseline=trainingDays.length?avg(trainingDays):0
  const dowBase=getDayOfWeekBaseline(dowAvgTable,dow,'trainingKcal',baseline)
  const effBaseline=dowBase||baseline
  const restStatus=checkRecovery(trainingLogs,today,userType)

  if (restStatus==='forced_rest') return {pct:100,level:'rest',label:'该休息了，身体需要恢复'}
  if (restStatus==='smart_rest') return {pct:100,level:'rest',label:'昨天练得猛，今天休息是聪明的选择'}
  if (todayKcal===0) {
    if (restStatus==='inactive_3plus') return {pct:0,level:'low',label:'身体休息好了，准备好了再出发'}
    return {pct:0,level:'silent',label:''}
  }
  if (effBaseline===0) return {pct:80,level:'high',label:'开始训练了，继续加油'}

  const ratio=todayKcal/effBaseline
  let pct=ratio>1.10?100:ratio>=0.80?80:60
  if (restStatus==='light_day') pct=Math.round(pct*0.6)
  const label=pct>=80?'训练状态不错，消耗比近期均值高':pct>=60?'训练节奏稳定，保持得很好':'今天轻松练，节奏你来定'
  return {pct,level:pct>=80?'high':pct>=60?'mid':'low',label,todayKcal,baseline:Math.round(effBaseline)}
}

// === 6.4 步数 ===
function scoreSteps(todayRecord, history, today, dowAvgTable) {
  const todaySteps=todayRecord.steps||0
  const recent7=history.slice(-7).map(d=>d.steps||0)
  const baseline=avg(recent7)
  const dow=dayOfWeek(today)
  const effBaseline=getDayOfWeekBaseline(dowAvgTable,dow,'steps',baseline)||baseline

  if (effBaseline===0) {
    const ratio=todaySteps/6000
    const pct=ratio>=1?80:ratio>=0.5?50:30
    const label=ratio>=1?'步数达标':ratio>=0.5?'可以多走几步':'今天走得少没关系，明天多走几步就好'
    return {pct,level:pct>=80?'high':pct>=50?'mid':'low',label,todaySteps,baseline:6000}
  }
  const ratio=todaySteps/effBaseline
  let pct=ratio>1.10?100:ratio>=0.80?Math.round(60+(ratio-0.80)/0.30*40):ratio>=0.50?Math.round(30+(ratio-0.50)/0.30*30):0

  const older7=history.slice(-14,-7).map(d=>d.steps||0)
  const olderAvg=avg(older7)
  let label=''
  if (olderAvg>0&&baseline<olderAvg*0.7) label='最近整体走得少了，明天散个步？'
  else if (pct>=80) label='步数表现不错'
  else if (pct>=60) label='步数正常'
  return {pct,level:pct>=80?'high':pct>=60?'mid':'low',label,todaySteps,baseline:Math.round(effBaseline)}
}

// === 有氧训练 ===
function scoreCardioTraining(profile, todayRecord, history, trainingLogs, weightHistory, today, dowAvgTable) {
  const cardioKcalToday=(trainingLogs||[]).filter(t=>t.date===today).reduce((s,t)=>s+(t.totalKcal||0),0)
  const trainingDays=history.slice(-7).map(d=>d.trainingKcal||0).filter(k=>k>0)
  const baseline=trainingDays.length?avg(trainingDays):0
  const dow=dayOfWeek(today)
  const effBaseline=getDayOfWeekBaseline(dowAvgTable,dow,'trainingKcal',baseline)||baseline
  if (cardioKcalToday===0) return {pct:0,level:'silent',label:''}
  if (effBaseline===0) return {pct:50,level:'mid',label:'开始训练了，继续加油'}
  const ratio=cardioKcalToday/effBaseline
  return {pct:ratio>1.10?100:ratio>=0.80?80:60,level:ratio>=0.80?'high':ratio>=0.60?'mid':'low',label:ratio>=0.80?'有氧训练不错':ratio>=0.60?'有氧训练正常':'',todayKcal:cardioKcalToday,baseline:Math.round(effBaseline)}
}

// === 混合型训练 ===
function scoreHybridTraining(profile, todayRecord, history, trainingLogs, weightHistory, today, dowAvgTable) {
  const strengthR=scoreTraining(profile,todayRecord,history,trainingLogs,weightHistory,today,'strength',dowAvgTable)
  const cardioR=scoreCardioTraining(profile,todayRecord,history,trainingLogs,weightHistory,today,dowAvgTable)
  const stepsR=scoreSteps(todayRecord,history,today,dowAvgTable)
  const cardioCombined=(cardioR.pct*35+stepsR.pct*20)/55
  const todayTs=(trainingLogs||[]).filter(t=>t.date===today)
  const hasS=todayTs.some(t=>(t.exercises||[]).some(e=>!CARDIO_KEYS.includes(e.key)))
  const hasC=todayTs.some(t=>(t.exercises||[]).some(e=>CARDIO_KEYS.includes(e.key)))||(todayRecord.steps||0)>=5000

  let pct=hasS&&hasC?strengthR.pct*0.5+cardioCombined*0.5:hasS?strengthR.pct:hasC?cardioCombined:0
  const rs=checkRecovery(trainingLogs,today,'hybrid')
  if (rs==='smart_rest'||rs==='forced_rest') return {pct:100,level:'rest',label:strengthR.label}
  return {pct:Math.round(pct),level:strengthR.level,label:strengthR.label}
}

// === 6.6 饮食质量 ===
function scoreDiet(todayDiets, profile) {
  if (!todayDiets||!todayDiets.length) return {pct:0,level:'silent',label:''}
  const allItems=todayDiets.flatMap(d=>d.items||[])
  const totalKcal=todayDiets.reduce((s,d)=>s+(d.totalKcal||0),0)

  let proteinKcal=0
  for (let it of allItems) {
    const f=foods.getFoodByName(it.food)
    if (f&&HIGH_PROTEIN_CATS.includes(f.cat)) proteinKcal+=(it.kcal||0)
  }
  const proteinR=totalKcal>0?proteinKcal/totalKcal:0
  const targetP=profile.goal==='lose'?0.35:profile.goal==='gain'?0.30:0.25
  const proteinScore=proteinR>=targetP?40:proteinR>=targetP*0.7?20:0

  const hasVeggie=allItems.some(it=>{const f=foods.getFoodByName(it.food);return f&&VEGGIE_CATS.includes(f.cat)})
  const veggieScore=hasVeggie?30:0

  const junkCount=allItems.filter(it=>JUNK_FOOD.includes(it.food)).length
  const junkScore=junkCount>=3?0:junkCount===2?10:junkCount===1?20:30

  const meals=new Set(todayDiets.map(d=>d.mealType||''))
  const bonus=meals.has('breakfast')&&meals.has('lunch')&&meals.has('dinner')?5:0

  const pct=Math.min(100,proteinScore+veggieScore+junkScore+bonus)
  const sug=[]
  if (proteinScore<40) sug.push('蛋白质可以再多吃一点')
  if (!hasVeggie) sug.push('来点蔬果，身体会更舒服')
  if (junkScore<30) sug.push('偶尔吃点零食没关系的，明天继续')
  const label=pct>=80?'饮食搭配合理'+(sug.length?'，'+sug.join('，'):''):pct>=60?'饮食还可以更好：'+sug.join('，'):''
  return {pct,level:pct>=80?'high':pct>=60?'mid':'low',label,suggestions:sug}
}

// === 6.7 习惯 ===
function calculateStreak(allDailyRecords, today) {
  let streak=0
  const d=new Date(today+'T00:00:00')
  for (let i=0;i<365;i++) {
    const ds=fmtDate(d), rec=allDailyRecords[ds]
    if (rec&&((rec.steps||0)>0||(rec.trainingKcal||0)>0||(rec.dietKcal||0)>0)) streak++
    else break
    d.setDate(d.getDate()-1)
  }
  return streak
}

function scoreHabit(allDailyRecords, todayRecord, today) {
  const streak=calculateStreak(allDailyRecords,today)

  // Completeness: meaningful data in each category
  const hasSteps=(todayRecord.steps||0)>=500
  const hasTraining=(todayRecord.trainingKcal||0)>=50
  const hasDiet=(todayRecord.dietKcal||0)>=200
  const sleepData=todayRecord.sleep
  const hasSleep=sleepData&&sleepData.durationHours>=3
  const filled=[hasSteps,hasTraining,hasDiet,hasSleep].filter(Boolean).length

  const completenessMap=[0,17,35,52,70]
  const completeness=completenessMap[filled]||0

  let streakBonus=0
  if (streak>=30) streakBonus=30
  else if (streak>=14) streakBonus=20
  else if (streak>=7) streakBonus=10
  else if (streak>=3) streakBonus=5

  const pct=Math.min(100,completeness+streakBonus)
  const missing=[]
  if (!hasSteps) missing.push('步数')
  if (!hasTraining) missing.push('训练')
  if (!hasDiet) missing.push('饮食')
  if (!hasSleep) missing.push('睡眠')

  let label=''
  if (pct>=80) label=streak>=14?'全勤记录，习惯很棒':'今天记录很完整'
  else if (pct>=50) label=missing.length?`还差${missing.join('、')}`:'继续完善记录'
  else if (pct>=20) label=missing.length>=2?'多项未记录，今天补上？':'开始记录了，继续完善'
  else label='今天开始记录吧'

  return {pct,level:pct>=80?'high':pct>=50?'mid':'low',label,streak,filled}
}

// === v11 睡眠评分 ===
function scoreSleep(sleepData, sleepHistory14) {
  if (!sleepData||!sleepData.durationHours||sleepData.durationHours<=0) {
    return {pct:0,level:'silent',label:'',durationScore:0,consistencyScore:0,timingScore:0}
  }
  const dur=Math.min(16,Math.max(0.5,sleepData.durationHours))
  const durHit=SLEEP_DUR_BANDS.find(b=>b.test(dur))
  const durScore=durHit?durHit.score:10

  let conScore=10
  const ownTime=sleepData.bedTime&&sleepData.bedTime.includes(':')?[sleepData.bedTime]:[]
  const bedTimes=ownTime.concat((sleepHistory14||[]).map(s=>s.bedTime).filter(t=>t&&t.includes(':')))
  if (bedTimes.length>=2) {
    const mins=bedTimes.map(t=>{const[p,q]=t.split(':').map(Number);return isNaN(p)||isNaN(q)?null:p*60+q}).filter(v=>v!==null)
    const mean=avg(mins), variance=mins.reduce((s,v)=>s+(v-mean)*(v-mean),0)/mins.length
    const std=Math.sqrt(variance)
    conScore=std<30?20:std<60?15:std<90?10:std<120?5:0
  }

  let timeScore=10
  if (sleepData.bedTime) {
    const h=parseInt(sleepData.bedTime.split(':')[0])
    if (isNaN(h)) { timeScore=0 }
    else if (h>=21&&h<=23) timeScore=10
    else if (h>=0&&h<2) timeScore=5
    else timeScore=0
  }

  const pct=Math.min(100,durScore+conScore+timeScore)
  const bh=parseInt((sleepData.bedTime||'').split(':')[0]); const late=!isNaN(bh)&&bh>=0&&bh<6
  let label=''
  const labelHit=SLEEP_LABELS.find(b=>pct>=b.min)
  if (labelHit) label=labelHit.text(conScore)
  if (late&&pct<80) label=(label?label+'。':'')+'早点休息，给身体恢复的机会'

  return {pct,level:pct>=80?'high':pct>=60?'mid':pct>=40?'low':pct>0?'low':'silent',label,durScore,conScore,timeScore,duration:sleepData.durationHours,bedTime:sleepData.bedTime,isLateNight:late}
}

function countConsecutivePoorSleep(allDailyRecords, today, threshold) {
  let count=0; const d=new Date(today+'T00:00:00')
  for (let i=1;i<=14;i++) {
    d.setDate(d.getDate()-1); const ds=fmtDate(d)
    const rec=allDailyRecords[ds], sl=rec?rec.sleep:null
    if (sl&&sl.durationHours&&sl.durationHours<threshold) count++; else if (!sl) { /* skip missing day, keep counting */ } else break
  }
  return count
}

// === 里程碑 ===
function checkMilestones(allDailyRecords, today, trainingHistory, sleep) {
  const ms=[]
  const streak=calculateStreak(allDailyRecords,today)
  if (streak===30) ms.push('连续记录30天！')
  else if (streak===14) ms.push('连续记录14天！')
  else if (streak===7) ms.push('连续记录7天！')

  const d=new Date(today+'T00:00:00'), dow=d.getDay()
  const mon=new Date(d); mon.setDate(d.getDate()-(dow===0?6:dow-1))
  let wMax=0,wMaxDate=''
  for (let i=0;i<7;i++) {
    const ds=new Date(mon); ds.setDate(mon.getDate()+i)
    const key=fmtDate(ds), rec=allDailyRecords[key]
    if (rec&&(rec.steps||0)>wMax){wMax=rec.steps;wMaxDate=key}
  }
  if (wMax>0&&wMaxDate===today) ms.push('本周步数创新高！')
  if (sleep&&sleep.pct>=80&&sleep.conScore>=15) ms.push('作息规律，睡眠质量持续在线')
  return ms
}

// === 总结文案(规则组驱动:组内互斥,组间顺序执行) ===
function generateSummary(results) {
  const {depth}=results
  const parts=[]
  for (const group of SUMMARY_GROUPS) {
    const rule=group.find(r=>r.test(results))
    if (rule) parts.push(rule.text(results))
  }

  const isEarly = depth && depth.phase === 'early'
  const isBuilding = depth && depth.phase === 'building'

  if (!parts.length) {
    if (isEarly) return '刚刚开始，坚持记录下来'
    if (isBuilding) return '数据积累中，分数正在变得越来越准确'
    return '今天还没有记录，打开记录一下吧'
  }
  if (isEarly) parts.push('数据在积累，坚持记录分数会更准')
  return parts.join('。')+'。'
}

// === 7. 总分 (v11) ===
function calculateScore(input) {
  const{profile,today,todayRecord,todayTrainings,todayDiets,history,trainingHistory,allDailyRecords,weightHistory}=input

  const depth = getDataDepth(allDailyRecords, today)
  const userType=determineUserType(history,trainingHistory)
  const weights=Object.assign({}, WEIGHTS[userType])
  const dowAvgTable=buildDayOfWeekAvg(allDailyRecords,trainingHistory)

  const calorie=scoreCalorie(profile,todayRecord,history,weightHistory,today)
  const diet=scoreDiet(todayDiets,profile)
  const habit=scoreHabit(allDailyRecords,todayRecord,today)

  const todaySleep=todayRecord.sleep||null
  const sleepHistory14=history.map(d=>d.sleep).filter(Boolean)
  const sleep=scoreSleep(todaySleep,sleepHistory14)
  const consecPoorSleep=countConsecutivePoorSleep(allDailyRecords,today,6)

  const d1=new Date(today+'T00:00:00');d1.setDate(d1.getDate()-1)
  const yestDate=fmtDate(d1), yestRec=allDailyRecords[yestDate]
  const yestSleep=yestRec?yestRec.sleep:null, yestSleepH=yestSleep?yestSleep.durationHours:null

  let training, cardioScore, stepsScore
  if (userType==='diet_only') training={pct:100,level:'silent',label:''}
  else if (userType==='hybrid') training=scoreHybridTraining(profile,todayRecord,history,trainingHistory,weightHistory,today,dowAvgTable)
  else if (userType==='cardio') {
    cardioScore=scoreCardioTraining(profile,todayRecord,history,trainingHistory,weightHistory,today,dowAvgTable)
    stepsScore=scoreSteps(todayRecord,history,today,dowAvgTable)
    training={pct:Math.round((cardioScore.pct*35+stepsScore.pct*20)/55),level:stepsScore.level||cardioScore.level,label:[cardioScore.label,stepsScore.label].filter(Boolean).join('；'),cardioScore,stepsScore}
  } else training=scoreTraining(profile,todayRecord,history,trainingHistory,weightHistory,today,userType,dowAvgTable)

  // v11 交叉影响(规则组表驱动,行为与 if 链等价)
  const crossEffects=[]
  const ctx={profile,today,todayRecord,todayTrainings,todayDiets,history,trainingHistory,allDailyRecords,weightHistory,
    sleep,calorie,training,diet,habit,yestSleepH,consecPoorSleep,userType,todaySleep,crossEffects}
  for (const group of CROSS_GROUPS) {
    const rule=group.find(r=>r.test(ctx))
    if (rule) rule.apply(ctx)
  }

  // Early phase: reduce training weight (no baseline yet), habit is already self-regulating
  if (depth.phase !== 'mature' && userType !== 'diet_only') {
    weights.training = Math.max(10, Math.round((weights.training || 27) * 0.6))
  }

  const summaryText=generateSummary({userType,totalScore:0,calorie,training,diet,sleep,habit,profile,consecutivePoorSleep:consecPoorSleep,crossEffects,depth})
  const milestones=checkMilestones(allDailyRecords,today,trainingHistory,sleep)

  // 总分
  let totalPct
  if (userType==='cardio'){
    totalPct=calorie.pct*weights.calorie/100+cardioScore.pct*weights.training/100+stepsScore.pct*20/100+diet.pct*weights.diet/100+sleep.pct*weights.sleep/100+habit.pct*weights.habit/100
  } else {
    totalPct=calorie.pct*weights.calorie/100+training.pct*weights.training/100+diet.pct*weights.diet/100+sleep.pct*weights.sleep/100+habit.pct*weights.habit/100
  }

  return {
    totalScore:Math.round(Math.min(100,totalPct)),userType,isColdStart:false,
    dimensions:{calorie,training,diet,sleep,habit},
    summaryText,milestones,sleep,consecutivePoorSleep:consecPoorSleep,warnings:crossEffects,
    depth
  }
}

module.exports = { calculateScore, WEIGHTS, determineUserType, getDataDepth, scoreSteps }

});

__define('foods', function (module, exports) {
// Common Chinese food calorie database (per 100g unless noted)
const FOOD_DB = [
  // === 主食 ===
  { name: '白米饭', kcal: 116, unit: '100g', cat: '主食' },
  { name: '馒头', kcal: 223, unit: '100g', cat: '主食' },
  { name: '面条(煮)', kcal: 110, unit: '100g', cat: '主食' },
  { name: '全麦面包', kcal: 246, unit: '100g', cat: '主食' },
  { name: '小米粥', kcal: 46, unit: '100g', cat: '主食' },
  { name: '红薯', kcal: 86, unit: '100g', cat: '主食' },
  { name: '玉米', kcal: 112, unit: '100g', cat: '主食' },
  { name: '燕麦片', kcal: 377, unit: '100g', cat: '主食' },
  { name: '包子(猪肉)', kcal: 227, unit: '100g', cat: '主食' },
  { name: '饺子(猪肉)', kcal: 240, unit: '100g', cat: '主食' },
  { name: '油条', kcal: 386, unit: '100g', cat: '主食' },
  { name: '烧饼', kcal: 326, unit: '100g', cat: '主食' },

  // === 肉类 ===
  { name: '鸡胸肉', kcal: 133, unit: '100g', cat: '肉类' },
  { name: '鸡腿肉', kcal: 181, unit: '100g', cat: '肉类' },
  { name: '牛肉(瘦)', kcal: 106, unit: '100g', cat: '肉类' },
  { name: '猪肉(瘦)', kcal: 143, unit: '100g', cat: '肉类' },
  { name: '猪排骨', kcal: 264, unit: '100g', cat: '肉类' },
  { name: '羊肉', kcal: 203, unit: '100g', cat: '肉类' },
  { name: '鸭肉', kcal: 240, unit: '100g', cat: '肉类' },
  { name: '培根', kcal: 541, unit: '100g', cat: '肉类' },
  { name: '火腿肠', kcal: 212, unit: '100g', cat: '肉类' },

  // === 水产 ===
  { name: '三文鱼', kcal: 139, unit: '100g', cat: '水产' },
  { name: '虾仁', kcal: 48, unit: '100g', cat: '水产' },
  { name: '带鱼', kcal: 127, unit: '100g', cat: '水产' },
  { name: '鳕鱼', kcal: 88, unit: '100g', cat: '水产' },
  { name: '鲈鱼', kcal: 105, unit: '100g', cat: '水产' },

  // === 蛋奶豆 ===
  { name: '鸡蛋(煮)', kcal: 144, unit: '100g', cat: '蛋奶' },
  { name: '鸡蛋(炒)', kcal: 196, unit: '100g', cat: '蛋奶' },
  { name: '纯牛奶', kcal: 54, unit: '100ml', cat: '蛋奶' },
  { name: '酸奶(原味)', kcal: 72, unit: '100g', cat: '蛋奶' },
  { name: '豆腐', kcal: 81, unit: '100g', cat: '蛋奶' },
  { name: '豆浆', kcal: 16, unit: '100ml', cat: '蛋奶' },
  { name: '奶酪', kcal: 328, unit: '100g', cat: '蛋奶' },

  // === 蔬菜 ===
  { name: '西兰花', kcal: 36, unit: '100g', cat: '蔬菜' },
  { name: '菠菜', kcal: 28, unit: '100g', cat: '蔬菜' },
  { name: '番茄', kcal: 19, unit: '100g', cat: '蔬菜' },
  { name: '黄瓜', kcal: 16, unit: '100g', cat: '蔬菜' },
  { name: '白菜', kcal: 17, unit: '100g', cat: '蔬菜' },
  { name: '胡萝卜', kcal: 37, unit: '100g', cat: '蔬菜' },
  { name: '土豆', kcal: 81, unit: '100g', cat: '蔬菜' },
  { name: '生菜', kcal: 16, unit: '100g', cat: '蔬菜' },
  { name: '芹菜', kcal: 17, unit: '100g', cat: '蔬菜' },
  { name: '豆芽', kcal: 19, unit: '100g', cat: '蔬菜' },
  { name: '茄子', kcal: 21, unit: '100g', cat: '蔬菜' },

  // === 水果 ===
  { name: '苹果', kcal: 53, unit: '100g', cat: '水果' },
  { name: '香蕉', kcal: 93, unit: '100g', cat: '水果' },
  { name: '橙子', kcal: 48, unit: '100g', cat: '水果' },
  { name: '葡萄', kcal: 70, unit: '100g', cat: '水果' },
  { name: '西瓜', kcal: 31, unit: '100g', cat: '水果' },
  { name: '草莓', kcal: 32, unit: '100g', cat: '水果' },
  { name: '蓝莓', kcal: 57, unit: '100g', cat: '水果' },
  { name: '猕猴桃', kcal: 61, unit: '100g', cat: '水果' },
  { name: '芒果', kcal: 60, unit: '100g', cat: '水果' },

  // === 零食/饮料 ===
  { name: '薯片', kcal: 548, unit: '100g', cat: '零食' },
  { name: '方便面', kcal: 473, unit: '100g', cat: '零食' },
  { name: '巧克力', kcal: 546, unit: '100g', cat: '零食' },
  { name: '饼干', kcal: 435, unit: '100g', cat: '零食' },
  { name: '可乐', kcal: 42, unit: '100ml', cat: '饮料' },
  { name: '奶茶', kcal: 65, unit: '100ml', cat: '饮料' },
  { name: '啤酒', kcal: 32, unit: '100ml', cat: '饮料' },
  { name: '拿铁咖啡', kcal: 56, unit: '100ml', cat: '饮料' },

  // === 中式菜 ===
  { name: '西红柿炒蛋', kcal: 87, unit: '100g', cat: '中餐' },
  { name: '宫保鸡丁', kcal: 178, unit: '100g', cat: '中餐' },
  { name: '鱼香肉丝', kcal: 154, unit: '100g', cat: '中餐' },
  { name: '麻婆豆腐', kcal: 103, unit: '100g', cat: '中餐' },
  { name: '回锅肉', kcal: 230, unit: '100g', cat: '中餐' },
  { name: '糖醋排骨', kcal: 280, unit: '100g', cat: '中餐' },
  { name: '水煮鱼', kcal: 153, unit: '100g', cat: '中餐' },
  { name: '蛋炒饭', kcal: 188, unit: '100g', cat: '中餐' },
  { name: '黄焖鸡', kcal: 137, unit: '100g', cat: '中餐' },
  { name: '酸辣土豆丝', kcal: 76, unit: '100g', cat: '中餐' },
  { name: '蒜蓉西兰花', kcal: 58, unit: '100g', cat: '中餐' },
  { name: '白切鸡', kcal: 186, unit: '100g', cat: '中餐' },

  // === 快餐 ===
  { name: '汉堡', kcal: 265, unit: '100g', cat: '快餐' },
  { name: '炸鸡翅', kcal: 260, unit: '100g', cat: '快餐' },
  { name: '披萨', kcal: 266, unit: '100g', cat: '快餐' },
  { name: '薯条', kcal: 312, unit: '100g', cat: '快餐' }
]

// Common serving sizes for quick add
const COMMON_SERVINGS = [
  { name: '1碗米饭', food: '白米饭', grams: 150, kcal: 174 },
  { name: '1个馒头', food: '馒头', grams: 100, kcal: 223 },
  { name: '1两面条', food: '面条(煮)', grams: 150, kcal: 165 },
  { name: '1块鸡胸', food: '鸡胸肉', grams: 150, kcal: 200 },
  { name: '1个煮蛋', food: '鸡蛋(煮)', grams: 50, kcal: 72 },
  { name: '1杯牛奶', food: '纯牛奶', grams: 250, kcal: 135 },
  { name: '1个苹果', food: '苹果', grams: 200, kcal: 106 },
  { name: '1根香蕉', food: '香蕉', grams: 120, kcal: 112 },
  { name: '1听可乐', food: '可乐', grams: 330, kcal: 139 },
  { name: '1杯奶茶', food: '奶茶', grams: 500, kcal: 325 },
  { name: '1份蛋炒饭', food: '蛋炒饭', grams: 300, kcal: 564 },
  { name: '1份西红柿炒蛋', food: '西红柿炒蛋', grams: 200, kcal: 174 }
]

function searchFoods(query) {
  if (!query) return COMMON_SERVINGS
  const q = query.toLowerCase()
  return FOOD_DB.filter(f =>
    f.name.includes(q) || f.cat.includes(q)
  ).slice(0, 20)
}

function getFoodByName(name) {
  return FOOD_DB.find(f => f.name === name) || null
}

function getQuickServing(name) {
  return COMMON_SERVINGS.find(s => s.name === name) || null
}

function calcFoodCalories(kcalPer100g, grams) {
  return Math.round((kcalPer100g / 100) * grams)
}

module.exports = { FOOD_DB, COMMON_SERVINGS, searchFoods, getFoodByName, getQuickServing, calcFoodCalories }

});

__define('photo-store', function (module, exports) {
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

});

__define('data', function (module, exports) {
/* 网页版数据层:与小程序版 D:\jianba\utils\data.js 接口签名一致
   存储后端:wx.getStorageSync → localStorage;照片文件系统 → photo-store(IndexedDB)
   注意:逻辑改动后需与小程序版同步,并跑冒烟测试 */
const calc = __require('./calc.js')
const foods = __require('./foods.js')
const score = __require('./score.js')
const photoStore = __require('./photo-store.js')

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
    out[date] = Object.assign({}, BASE_RECORD, rec)
  }
  return out
}

function load() {
  if (cache) return cache
  let merged = null
  try {
    const raw = readStorage()
    if (raw) {
      merged = Object.assign({}, DEFAULT, raw)
      merged.profile = Object.assign({}, DEFAULT.profile, raw.profile)
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
  data.profile = Object.assign({}, data.profile, partial)
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
    data.dailyRecords[today] = Object.assign({}, BASE_RECORD)
    save(data)
  }
  return data.dailyRecords[today]
}

function getRecordByDate(date) {
  const data = load()
  return data.dailyRecords[date] || Object.assign({}, BASE_RECORD)
}

function updateTodayRecord(partial) {
  const data = load()
  const today = todayStr()
  if (!data.dailyRecords[today]) {
    data.dailyRecords[today] = Object.assign({}, BASE_RECORD)
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
  const exercisesWithKcal = exercises.map(ex => (Object.assign({}, ex, {
    kcal: calc.calcExerciseCalories(ex.key, profile.weightKg, ex.sets, ex.reps, ex.met)
  })))
  const totalKcal = exercisesWithKcal.reduce((sum, ex) => sum + ex.kcal, 0)
  const record = { date: today, exercises: exercisesWithKcal, totalKcal, ts: Date.now(), time: recordTime || '' }
  data.trainingLogs.unshift(record)
  if (!data.dailyRecords[today]) data.dailyRecords[today] = Object.assign({}, BASE_RECORD)
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
  if (!data.dailyRecords[today]) data.dailyRecords[today] = Object.assign({}, BASE_RECORD)
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
  return data.dailyRecords[yest] || Object.assign({}, BASE_RECORD)
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
  data.dietLogs[idx] = Object.assign({}, oldEntry, { items: items, totalKcal: newTotalKcal })
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
  data.dietLogs[idx] = Object.assign({}, oldEntry, { items: items, photoPath: photoPath || oldEntry.photoPath, time: recordTime || oldEntry.time, totalKcal: newTotalKcal, mealType: mealType !== undefined ? mealType : oldEntry.mealType || '' })
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
  data.trainingLogs[idx] = Object.assign({}, oldEntry, { exercises: exercises, totalKcal: totalKcal, time: recordTime || oldEntry.time })
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
  const todayRecord = allRecords[dateStr] || Object.assign({}, BASE_RECORD)
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
    data.dailyRecords[date] = Object.assign({}, BASE_RECORD)
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

});

})();

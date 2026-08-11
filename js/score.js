const calc = require('./calc.js')
const foods = require('./foods.js')

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
  const weights={...WEIGHTS[userType]}
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

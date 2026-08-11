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

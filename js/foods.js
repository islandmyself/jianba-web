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

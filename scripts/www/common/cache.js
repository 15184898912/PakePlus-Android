const STORAGE_KEYS = {
  TOKEN: 'token',
  PHONE: 'phone',
  HISTORY: 'repair_history',
  FAVORITES: 'repair_favorites',
  SCHEMATICS: 'repair_schematics'
}

export function getHistory() {
  const history = uni.getStorageSync(STORAGE_KEYS.HISTORY)
  return history ? JSON.parse(history) : []
}

export function addToHistory(modelId, modelName) {
  let history = getHistory()
  history = history.filter(item => item.model_id !== modelId)
  history.unshift({
    model_id: modelId,
    model_name: modelName,
    time: new Date().toISOString()
  })
  if (history.length > 20) history = history.slice(0, 20)
  uni.setStorageSync(STORAGE_KEYS.HISTORY, JSON.stringify(history))
}

export function getFavorites() {
  const favorites = uni.getStorageSync(STORAGE_KEYS.FAVORITES)
  return favorites ? JSON.parse(favorites) : []
}

export function toggleFavorite(modelId) {
  let favorites = getFavorites()
  if (favorites.includes(modelId)) {
    favorites = favorites.filter(id => id !== modelId)
  } else {
    favorites.push(modelId)
  }
  uni.setStorageSync(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
  return favorites
}

export function isFavorite(modelId) {
  return getFavorites().includes(modelId)
}

export function cacheImage(modelId, imageUrl) {
  let schematics = uni.getStorageSync(STORAGE_KEYS.SCHEMATICS)
  schematics = schematics ? JSON.parse(schematics) : {}
  const keys = Object.keys(schematics)
  if (keys.length >= 200) {
    const oldestKey = keys.reduce((oldest, key) => {
      return schematics[key].timestamp < schematics[oldest].timestamp ? key : oldest
    }, keys[0])
    delete schematics[oldestKey]
  }
  schematics[modelId] = { url: imageUrl, timestamp: Date.now() }
  uni.setStorageSync(STORAGE_KEYS.SCHEMATICS, JSON.stringify(schematics))
}

export function getCachedImage(modelId) {
  const schematics = uni.getStorageSync(STORAGE_KEYS.SCHEMATICS)
  if (!schematics) return null
  const data = JSON.parse(schematics)[modelId]
  return data ? data.url : null
}

export function getCacheSize() {
  const schematics = uni.getStorageSync(STORAGE_KEYS.SCHEMATICS)
  if (!schematics) return 0
  return Object.keys(JSON.parse(schematics)).length
}

export function clearAllCache() {
  uni.removeStorageSync(STORAGE_KEYS.SCHEMATICS)
  uni.showToast({ title: '缓存已清除', icon: 'success' })
}
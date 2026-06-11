import request from './request'

/** 生成新的治愈碎片 */
export function generateFragment({ moodLevel, note }) {
  return request.post('/v1/user/healing/generate', { moodLevel, note })
}

/** 获取我的所有碎片 */
export function listFragments() {
  return request.get('/v1/user/healing/list')
}

/** 标记已读 */
export function markFragmentRead(fragmentId) {
  return request.put(`/v1/user/healing/${fragmentId}/read`)
}

/** 7天心情趋势 */
export function getWeeklyTrend() {
  return request.get('/v1/user/healing/trend')
}

/** 删除碎片 */
export function deleteFragment(fragmentId) {
  return request.delete(`/v1/user/healing/${fragmentId}`)
}

import axios from 'axios'
import { message } from 'antd'

const aiRequest = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

aiRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

aiRequest.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      message.error(res.message || 'AI 请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录')
    } else if (error.response?.status === 404) {
      message.error('AI 接口不存在，请重启 user-service 后再试')
    } else {
      message.error(error.response?.data?.message || error.message || 'AI 服务不可用')
    }
    return Promise.reject(error)
  },
)

export function sendAiChat(messages) {
  return aiRequest.post('/v1/user/ai/chat', { messages })
}

import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器：自动带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

function resolveErrorMessage(error) {
  const data = error.response?.data
  if (data?.message) return data.message
  if (data?.msg) return data.msg
  const status = error.response?.status
  if (status === 500 || status === 502 || status === 503 || !error.response) {
    return '后端服务未启动或暂不可用，请确认 appointment-service (8082) 等服务已运行'
  }
  return error.message || '网络错误'
}

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      if (!response.config?.silent) {
        message.error(res.message || '请求失败')
      }
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
      if (!error.config?.silent) {
        message.error('登录已过期，请重新登录')
      }
    } else if (!error.config?.silent) {
      message.error(resolveErrorMessage(error))
    }
    return Promise.reject(error)
  },
)

export default request

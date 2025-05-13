import { createApp, ref, getCurrentInstance } from 'vue'
import Toast from '../components/Toast.vue'

/**
 * @typedef {Object} ToastOptions
 * @property {string} message - Toast 消息内容
 * @property {string} type - Toast 类型：'success' | 'warning' | 'error' | 'info'
 * @property {number} duration - 显示持续时间（毫秒）
 * @property {string} position - 显示位置：'top' | 'bottom' | 'center'
 */

// * 默认配置
const defaultOptions = {
  duration: 3000,
  position: 'top'
}

// * 单例模式的核心变量
let toastInstance = null  // ? 存储 Toast 组件实例
let toastContainer = null // ? 存储 Toast 容器 DOM
let toastApp = null      // ? 存储 Vue 应用实例

// * 创建或获取 Toast 容器
const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

// * 显示 Toast 的核心方法
const showToast = (options) => {
  const mergedOptions = { ...defaultOptions, ...options }
  
  if (!toastInstance) {
    const container = createToastContainer()
    toastApp = createApp(Toast, mergedOptions)
    toastInstance = toastApp.mount(container)
  } else {
    toastApp.unmount()
    const container = createToastContainer()
    toastApp = createApp(Toast, mergedOptions)
    toastInstance = toastApp.mount(container)
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, mergedOptions.duration)
  })
}

// * 组合式函数
export const useToast = () => {
  return {
    success: (message, duration = defaultOptions.duration) => 
      showToast({ message, type: 'success', duration }),
    warning: (message, duration = defaultOptions.duration) => 
      showToast({ message, type: 'warning', duration }),
    error: (message, duration = defaultOptions.duration) => 
      showToast({ message, type: 'error', duration }),
    info: (message, duration = defaultOptions.duration) => 
      showToast({ message, type: 'info', duration })
  }
}

// * Vue 插件定义
const ToastPlugin = {
  install: (app) => {
    app.config.globalProperties.$toast = {
      success: (message, duration = defaultOptions.duration) => 
        showToast({ message, type: 'success', duration }),
      warning: (message, duration = defaultOptions.duration) => 
        showToast({ message, type: 'warning', duration }),
      error: (message, duration = defaultOptions.duration) => 
        showToast({ message, type: 'error', duration }),
      info: (message, duration = defaultOptions.duration) => 
        showToast({ message, type: 'info', duration })
    }
  }
}

export default ToastPlugin 
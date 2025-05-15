import { createApp, ref } from 'vue'
import Dialog from '../components/Dialog.vue'

/**
 * @typedef {Object} DialogOptions
 * @property {string} title - 对话框标题
 * @property {string} content - 对话框内容
 * @property {Function} onAccept - 确认回调
 * @property {Function} onCancel - 取消回调
 */

// * 单例模式的核心变量
let dialogInstance = null  // ? 存储 Dialog 组件实例
let dialogContainer = null // ? 存储 Dialog 容器 DOM
let dialogApp = null      // ? 存储 Vue 应用实例

// * 创建或获取 Dialog 容器
const createDialogContainer = () => {
  if (!dialogContainer) {
    dialogContainer = document.createElement('div')
    dialogContainer.id = 'dialog-container'
    document.body.appendChild(dialogContainer)
  }
  return dialogContainer
}

// * 显示 Dialog 的核心方法
const showDialog = (options) => {
  return new Promise((resolve, reject) => {
    const mergedOptions = {
      ...options,
      onAccept: async () => {
        try {
          await options.onAccept?.()
          resolve(true)
        } catch (error) {
          reject(error)
        }
      },
      onCancel: () => {
        options.onCancel?.()
        resolve(false)
      }
    }
    
    if (!dialogInstance) {
      const container = createDialogContainer()
      dialogApp = createApp(Dialog, mergedOptions)
      dialogInstance = dialogApp.mount(container)
    } else {
      dialogApp.unmount()
      const container = createDialogContainer()
      dialogApp = createApp(Dialog, mergedOptions)
      dialogInstance = dialogApp.mount(container)
    }
  })
}

// * 组合式函数
export const useDialog = () => {
  return {
    confirm: (title, content, onAccept, onCancel) => 
      showDialog({ title, content, onAccept, onCancel })
  }
}

// * Vue 插件定义
const DialogPlugin = {
  install: (app) => {
    app.config.globalProperties.$dialog = {
      confirm: (title, content, onAccept, onCancel) => 
        showDialog({ title, content, onAccept, onCancel })
    }
  }
}

export default DialogPlugin 
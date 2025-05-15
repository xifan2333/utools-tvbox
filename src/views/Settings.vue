<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">站点设置</h1>
      <div class="flex space-x-2">
        <button
          @click="importSources"
          class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
        >
          <i class="i-ri-upload-2-line mr-1"></i>
          导入配置
        </button>
        <button
          @click="exportSources"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
        >
          <i class="i-ri-download-2-line mr-1"></i>
          导出配置
        </button>
      </div>
    </div>
    
    <!-- 解析接口配置 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">解析接口配置</h2>
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">解析接口地址</label>
          <div class="flex space-x-2">
            <input
              v-model="parseApi"
              type="text"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              placeholder="输入解析接口地址"
            >
            <button
              @click="saveParseApi"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
          </div>
          <div class="mt-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">当前使用：</span>
              <span class="text-sm text-blue-600 dark:text-blue-400">{{ currentParseApi }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加新站点 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">添加新站点</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">站点名称</label>
          <input
            v-model="newSource.name"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            placeholder="输入站点名称"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">站点ID</label>
          <input
            v-model="newSource.id"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            placeholder="输入站点ID（英文）"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API地址</label>
          <input
            v-model="newSource.api"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            placeholder="输入API地址"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详情页地址</label>
          <input
            v-model="newSource.detail"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            placeholder="输入详情页地址"
          >
        </div>
        <div class="md:col-span-2">
          <label class="flex items-center space-x-2">
            <input
              v-model="newSource.isOfficial"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            >
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">官采站点</span>
          </label>
        </div>
      </div>
      <div class="mt-4">
        <button
          @click="addSource"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <i class="i-ri-add-box-line"></i>
          添加站点
        </button>
      </div>
    </div>

    <!-- 编辑站点对话框 -->
    <div v-if="showEditDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">编辑站点</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">站点名称</label>
            <input
              v-model="editingSource.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              placeholder="输入站点名称"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">站点ID</label>
            <input
              v-model="editingSource.id"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              placeholder="输入站点ID（英文）"
              disabled
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API地址</label>
            <input
              v-model="editingSource.api"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              placeholder="输入API地址"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详情页地址</label>
            <input
              v-model="editingSource.detail"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              placeholder="输入详情页地址"
            >
          </div>
          <div class="md:col-span-2">
            <label class="flex items-center space-x-2">
              <input
                v-model="editingSource.isOfficial"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              >
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">官采站点</span>
            </label>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showEditDialog = false"
            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            @click="saveEdit"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 站点列表 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">站点列表</h2>
      <div class="space-y-4">
        <div
          v-for="source in sources"
          :key="source.id"
          class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          :class="{ 'border-blue-500 dark:border-blue-500': source.enabled }"
        >
          <div class="flex items-center space-x-4">
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="font-medium text-gray-800 dark:text-gray-200">{{ source.name }}</h3>
                <span
                  v-if="source.enabled"
                  class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded"
                >
                  已启用
                </span>
                <span
                  v-if="source.isOfficial"
                  class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded"
                >
                  官采
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ source.api }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="editSource(source)"
              class="px-3 py-1 bg-blue-500 text-white rounded-md transition-colors hover:bg-blue-600"
            >
              <i class="i-ri-edit-line"></i>
              编辑
            </button>
            <button
              v-if="!source.enabled"
              @click="enableSource(source.id)"
              class="px-3 py-1 bg-green-500 text-white rounded-md transition-colors hover:bg-green-600"
            >
              <i class="i-ri-check-line"></i>
              启用
            </button>
            <button
              v-else
              @click="disableSource(source.id)"
              class="px-3 py-1 bg-yellow-500 text-white rounded-md transition-colors hover:bg-yellow-600"
            >
              <i class="i-ri-close-line"></i>
              禁用
            </button>
            <button
              @click="removeSource(source.id)"
              class="px-3 py-1 bg-red-500 text-white rounded-md transition-colors hover:bg-red-600"
            >
              <i class="i-ri-delete-bin-2-line"></i>  
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDialog } from '../plugins/dialog'
import { useToast } from '../plugins/toast'

const dialog = useDialog()
const toast = useToast()
const sources = ref([])
const parseApi = ref('')
const showEditDialog = ref(false)
const editingSource = ref(null)
const newSource = ref({
  id: '',
  name: '',
  api: '',
  detail: '',
  enabled: true,
  isOfficial: false
})

// 计算当前使用的解析接口
const currentParseApi = computed(() => {
  return parseApi.value || 'https://jx.xmflv.com/?url='
})

// 加载站点列表
const loadSources = () => {
  sources.value = window.services.video.getSources()
}

// 加载解析接口
const loadParseApi = () => {
  parseApi.value = window.services.parseApi.getParseApi()
}

// 保存解析接口
const saveParseApi = () => {
  try {
    window.services.parseApi.setParseApi(parseApi.value)
    toast.success('保存解析接口成功')
  } catch (error) {
    toast.error(error?.message || '保存解析接口失败')
  }
}

// 添加新站点
const addSource = () => {
  if (!newSource.value.id || !newSource.value.name || !newSource.value.api || !newSource.value.detail) {
    toast.error('请填写完整的站点信息')
    return
  }

  // 检查ID是否已存在
  if (sources.value.some(s => s.id === newSource.value.id)) {
    toast.error('站点ID已存在')
    return
  }

  // 调用 service 层校验
  const validation = window.services.video.validateSource(newSource.value)
  if (!validation.valid) {
    toast.error(validation.error || '站点信息校验失败')
    return
  }

  try {
    window.services.video.addSource({
      ...newSource.value,
      enabled: true // 新添加的站点默认启用
    })
    // 重置表单
    newSource.value = {
      id: '',
      name: '',
      api: '',
      detail: '',
      enabled: true,
      isOfficial: false
    }
    loadSources()
  } catch (error) {
    toast.error(error?.message || '添加站点失败')
  }
}

// 切换站点启用状态
const enableSource = (sourceId) => {
  window.services.video.enableSource(sourceId)
  loadSources()
}

// 禁用站点
const disableSource = (sourceId) => {
  window.services.video.disableSource(sourceId)
  loadSources()
}

// 删除站点
const removeSource = async (sourceId) => {
  const confirmed = await dialog.confirm(
    '删除站点',
    '确定要删除这个站点吗？此操作不可恢复。',
    () => {
      window.services.video.removeSource(sourceId)
      loadSources()
    }
  )
}

// 编辑站点
const editSource = (source) => {
  editingSource.value = { ...source }
  showEditDialog.value = true
}

// 保存编辑
const saveEdit = async () => {
  try {
    if (!editingSource.value.name || !editingSource.value.api || !editingSource.value.detail) {
      toast.error('请填写完整的站点信息')
      return
    }

    await window.services.video.updateSource(editingSource.value.id, {
      name: editingSource.value.name,
      api: editingSource.value.api,
      detail: editingSource.value.detail,
      isOfficial: editingSource.value.isOfficial
    })

    showEditDialog.value = false
    loadSources()
    toast.success('站点更新成功')
  } catch (error) {
    toast.error(error.message || '更新站点失败')
  }
}

// 导入配置
const importSources = async () => {
  try {
    const files = window.utools.showOpenDialog({
      title: '选择配置文件',
      filters: [
        { name: 'JSON', extensions: ['json'] }
      ],
      properties: ['openFile']
    })

    if (!files?.length) {
      return
    }

    const importResult = await window.services.video.importSources(files[0])
    if (importResult.code === 200) {
      toast.success(`导入成功：新增 ${importResult.added} 个站点，更新 ${importResult.updated} 个站点${importResult.parseUpdated ? '，已更新解析接口' : ''}`)
      loadSources()
      loadParseApi()
    } else {
      toast.error(importResult.msg || '导入失败')
    }
  } catch (error) {
    toast.error(error.message || '导入失败')
  }
}

// 导出配置
const exportSources = async () => {
  try {
    const result = await window.services.video.exportSources()
    if (result.code === 200) {
      toast.success(`导出成功：共 ${result.count} 个站点`)
    } else {
      toast.error(result.msg || '导出失败')
    }
  } catch (error) {
    toast.error(error.message || '导出失败')
  }
}

onMounted(() => {
  loadSources()
  loadParseApi()
})
</script> 
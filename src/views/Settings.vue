<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">站点设置</h1>
    
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
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ source.api }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
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
import { ref, onMounted } from 'vue'

const sources = ref([])
const newSource = ref({
  id: '',
  name: '',
  api: '',
  detail: '',
  enabled: true
})

// 加载站点列表
const loadSources = () => {
  sources.value = window.services.video.getSources()
}

// 添加新站点
const addSource = () => {
  if (!newSource.value.id || !newSource.value.name || !newSource.value.api || !newSource.value.detail) {
    alert('请填写完整的站点信息')
    return
  }

  // 检查ID是否已存在
  if (sources.value.some(s => s.id === newSource.value.id)) {
    alert('站点ID已存在')
    return
  }

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
    enabled: true
  }

  loadSources()
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
const removeSource = (sourceId) => {
  if (confirm('确定要删除这个站点吗？')) {
    const updatedSources = sources.value.filter(s => s.id !== sourceId)
    window.utools.dbStorage.setItem('sources', updatedSources)
    loadSources()
  }
}

onMounted(() => {
  loadSources()
})
</script> 
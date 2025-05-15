<template>
  <div class="p-8">
    <div class="mb-6">
      <div v-if="sources.length === 0"
        class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="i-ri-information-line text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              未配置视频源
            </h3>
            <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                请前往设置页面添加视频源。点击
                <router-link to="/settings"
                  class="font-medium underline text-yellow-800 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-400">
                  这里
                </router-link>
                进行配置。
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-4 mb-4">
        <input v-model="searchQuery" type="text"
          class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
          placeholder="输入关键词搜索" @keyup.enter="search">
        <select v-model="selectedSource"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200">
          <option value="">所有站点</option>
          <option v-for="source in sources" :key="source.id" :value="source.id">
            {{ source.name }}
          </option>
        </select>
        <button @click="search" class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
          <i class="i-ri-search-line"></i>
          搜索
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-4 text-gray-500 dark:text-gray-400">搜索中...</p>
    </div>

    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="!hasSearched" class="text-center py-12 text-gray-500 dark:text-gray-400">
      请输入关键词开始搜索
    </div>

    <div v-else-if="searchResults.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
      暂无搜索结果
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="item in searchResults" :key="item.vod_id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
        <div class="p-4">
          <!-- 标题和来源 -->
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
              {{ item.vod_name }}
            </h3>
            <span
              class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded whitespace-nowrap ml-2">
              {{ item.sourceName }}
            </span>
          </div>

          <!-- 分类和备注 -->
          <div class="flex flex-wrap gap-2 mb-3">
            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
              {{ item.type_name }}
            </span>
            <span v-if="item.vod_remarks"
              class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded">
              {{ item.vod_remarks }}
            </span>
          </div>

          <!-- 更新时间 -->
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            更新于 {{ formatDate(item.vod_time) }}
          </p>

          <!-- 操作按钮 -->
          <div class="flex justify-end">
            <button @click="playVideo(item)"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              播放
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '../plugins/toast'

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const selectedSource = ref('')
const searchResults = ref([])
const loading = ref(false)
const error = ref('')
const sources = ref([])
const hasSearched = ref(false)
const toast = useToast()

// 监听路由参数变化
watch(() => route.query.keyword, (newKeyword) => {
  if (newKeyword) {
    searchQuery.value = newKeyword
    search()
  }
})

// 加载站点列表
const loadSources = () => {
  const sourcesList = window.services.video.getSources()
  sources.value = sourcesList || []

  // 如果没有启用的源，显示提示
  if (sources.value.length === 0) {
    error.value = '请先配置视频源'
  }
}

// 搜索视频
const search = async () => {
  if (!searchQuery.value.trim()) {
    error.value = '请输入搜索关键词'
    toast.error('请输入搜索关键词')
    return
  }

  loading.value = true
  error.value = ''
  searchResults.value = []
  hasSearched.value = true

  try {
    const result = await window.services.video.search(searchQuery.value, selectedSource.value || null)
    searchResults.value = result.list
  } catch (err) {
    toast.error(err.message || '搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 播放视频
const playVideo = (item) => {
  router.push({
    path: `/player/${item.vod_id}`,
    query: {
      title: item.vod_name,
      vod_id: item.vod_id,
      vod_remarks: item.vod_remarks,
      vod_play_from: item.vod_play_from,
      type_id: item.type_id,
      type_name: item.type_name,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      from: 'search',
      keyword: searchQuery.value
    }
  })
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadSources()
  // 检查是否有搜索关键词
  if (route.query.keyword) {
    searchQuery.value = route.query.keyword
    search()
  }
})
</script>
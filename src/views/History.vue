<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">观看历史</h1>
      <button
        v-if="histories.length > 0"
        class="px-4 py-2 text-sm bg-red-500 text-white rounded-md transition-colors hover:bg-red-600"
        @click="clearHistories"
      >
        <i class="i-ri-delete-bin-3-line"></i>
        清空历史
      </button>
    </div>

    <div v-if="histories.length === 0" class="text-center text-gray-400 text-xl py-12">
      暂无观看历史
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="history in histories"
        :key="history.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group"
      >
        <!-- 视频信息卡片 -->
        <div class="p-4">
          <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">
            {{ history.vod_name }}
          </h3>
          <p v-if="history.vod_remarks" class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {{ history.vod_remarks }}
          </p>
          
          <!-- 进度条 -->
          <div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
            <div
              class="h-full bg-blue-500 rounded-full"
              :style="{ width: `${((history.currentEpisodeIndex + 1) / history.episodes.length) * 100}%` }"
            ></div>
          </div>

          <!-- 底部信息 -->
          <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div class="flex items-center space-x-2">
              <span>{{ formatTime(history.currentTime) }}</span>
              <span class="text-gray-400">|</span>
              <span>第 {{ history.currentEpisodeIndex + 1 }}/{{ history.episodes.length }} 集</span>
            </div>
            <div class="flex gap-2">
              <button
                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                @click="continueWatching(history)"
              >
                <i class="i-ri-play-circle-line"></i>
                继续观看
              </button>
              <button
                class="px-3 py-1 text-white hover:bg-red-600 transition-colors bg-red-500 rounded-md"
                @click="removeHistory(history.vod_id)"
              >
                <i class="i-ri-delete-bin-2-line"></i>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const histories = ref([])

// 获取历史记录
const loadHistories = () => {
  histories.value = window.services.history.getHistories()
}

// 继续观看
const continueWatching = (history) => {
  if (!history.episodes || history.episodes.length === 0) {
    console.error('无效的分集信息')
    return
  }
  
  router.push({
    path: `/player/${history.vod_id}`,
    query: {
      title: history.vod_name,
      vod_id: history.vod_id,
      vod_remarks: history.vod_remarks,
      vod_play_from: history.vod_play_from,
      type_id: history.type_id,
      type_name: history.type_name,
      episodes: JSON.stringify(history.episodes),
      currentEpisodeIndex: history.currentEpisodeIndex || 0,
      time: history.currentTime || 0
    }
  })
}

// 删除历史记录
const removeHistory = (id) => {
  window.services.history.removeHistory(id)
  loadHistories()
}

// 清空历史记录
const clearHistories = () => {
  if (confirm('确定要清空所有观看历史吗？')) {
    window.services.history.clearHistories()
    loadHistories()
  }
}

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

onMounted(() => {
  loadHistories()
})
</script> 
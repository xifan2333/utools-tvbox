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
        :key="history.vod_id + '-' + history.sourceId"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group"
      >
        <!-- 视频信息卡片 -->
        <div class="p-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
              {{ history.vod_name }}
              <span v-if="history.platform && history.platform !== ''" class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded ml-2">{{ history.platform }}</span>
            </h3>
            <span v-if="history.sourceName" class="text-sm text-gray-500 dark:text-gray-400 ml-4 whitespace-nowrap flex items-center">
              <i class="i-ri-global-line mr-1"></i>
              {{ history.sourceName }}
            </span>
          </div>
          <p v-if="history.vod_remarks" class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {{ history.vod_remarks }}
          </p>
          <!-- 进度提示 -->
          <div v-if="history.lastTime > 0" class="text-xs text-blue-600 dark:text-blue-300 mb-2">上次看到 {{ formatTime(history.lastTime) }}</div>
          <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>第 {{ (history.episodeIndex || 0) + 1 }} 集</span>
          </div>
          <!-- 底部按钮 -->
          <div class="flex justify-end gap-2 mt-2">
            <button
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              @click="continueWatching(history)"
            >
              <i class="i-ri-play-circle-line"></i>
              继续观看
            </button>
            <button
              class="px-3 py-1 text-white hover:bg-red-600 transition-colors bg-red-500 rounded-md"
              @click="removeHistory(history.vod_id, history.sourceId)"
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
import { useRouter } from 'vue-router'
import { useDialog } from '../plugins/dialog'
import { useToast } from '../plugins/toast'

const router = useRouter()
const dialog = useDialog()
const toast = useToast()

const histories = ref([])

// 获取历史记录
const loadHistories = () => {
  histories.value = window.services.history.getHistories()
}

// 继续观看
const continueWatching = (history) => {
  router.push({
    path: `/player/${history.vod_id}`,
    query: {
      title: history.vod_name,
      vod_id: history.vod_id,
      sourceId: history.sourceId,
      sourceName: history.sourceName,
      platform: history.platform,
      episodeIndex: history.episodeIndex,
      episodeUrl: history.episodeUrl,
      lastTime: history.lastTime,
      from: 'history'
    }
  })
}

// 删除历史记录
const removeHistory = async (vod_id, sourceId) => {
  try {
    const confirmed = await dialog.confirm(
      '删除历史记录',
      '确定要删除这条观看历史吗？',
      () => {
        window.services.history.removeHistory(vod_id, sourceId)
        loadHistories()
      }
    )
  } catch (error) {
    toast.error(error?.message || '删除历史记录失败')
  }
}

// 清空历史记录
const clearHistories = async () => {
  try {
    const confirmed = await dialog.confirm(
      '清空历史记录',
      '确定要清空所有观看历史吗？此操作不可恢复。',
      () => {
        window.services.history.clearHistories()
        loadHistories()
      }
    )
  } catch (error) {
    toast.error(error?.message || '清空历史记录失败')
  }
}

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0
    ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
  loadHistories()
})
</script> 
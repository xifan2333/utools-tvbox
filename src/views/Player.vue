<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../plugins/toast'
import Player from '../components/Player/index.vue'

const route = useRoute()
const { toast } = useToast()

const currentEpisode = ref('')
const episodes = ref([])
const loading = ref(true)
const currentEpisodeIndex = ref(0)
const videoInfo = ref(null)



// 获取视频信息
const fetchVideoInfo = async () => {
  try {
    const id = route.params.id
    // 优先使用 query 里的分集信息
    let episodesArr = []
    if (route.query.episodes) {
      try {
        episodesArr = JSON.parse(route.query.episodes)
        if (!Array.isArray(episodesArr) || episodesArr.length === 0) {
          throw new Error('无效的分集信息')
        }
      } catch (e) {
        console.error('解析分集信息失败:', e)
        if (toast && toast.error) toast.error('获取视频信息失败')
        return
      }
    } else {
      const detail = await window.services.video.getDetail(id, route.query.sourceId)
      episodesArr = detail.episodes || []
    }
    
    if (episodesArr.length > 0) {
      episodes.value = episodesArr
      // 如果有指定的分集索引，使用指定的分集
      const episodeIndex = route.query.currentEpisodeIndex ? parseInt(route.query.currentEpisodeIndex) : 0
      if (episodeIndex >= episodesArr.length) {
        console.error('分集索引超出范围')
        if (toast && toast.error) toast.error('分集信息错误')
        return
      }
      
      currentEpisode.value = episodesArr[episodeIndex]
      currentEpisodeIndex.value = episodeIndex
      
      // 保存视频信息到历史记录，包含分集列表和当前分集
      const pureVideoInfo = {
        vod_id: route.query.vod_id || id,
        vod_name: route.query.title,
        vod_remarks: route.query.vod_remarks || '',
        vod_play_from: route.query.vod_play_from || '',
        type_id: route.query.type_id || '',
        type_name: route.query.type_name || '',
        episodes: episodesArr.map(episode => String(episode)), // 确保所有分集都是字符串
        currentEpisodeIndex: episodeIndex,
        currentEpisode: String(episodesArr[episodeIndex]), // 确保当前分集是字符串
        currentTime: route.query.time ? parseFloat(route.query.time) : 0,
        duration: route.query.duration ? parseFloat(route.query.duration) : 0
      }
      videoInfo.value = pureVideoInfo
      window.services.history.addHistory(pureVideoInfo)
    } else {
      if (toast && toast.error) toast.error('获取视频信息失败')
    }
  } catch (error) {
    console.error('获取视频信息失败:', error)
    if (toast && toast.error) toast.error('获取视频信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 切换剧集
const switchEpisode = (index) => {
  currentEpisode.value = episodes.value[index]
  currentEpisodeIndex.value = index
  // 更新历史记录中的分集信息
  if (videoInfo.value) {
    const pureVideoInfo = {
      ...videoInfo.value,
      currentEpisodeIndex: index,
      currentEpisode: String(episodes.value[index]), // 确保当前分集是字符串
      currentTime: 0,
      episodes: episodes.value.map(episode => String(episode)) // 确保所有分集都是字符串
    }
    videoInfo.value = pureVideoInfo
    window.services.history.addHistory(pureVideoInfo)
  }
}

// 更新播放进度
const updateProgress = (currentTime, currentEpisodeIndex) => {
  if (videoInfo.value) {
    window.services.history.updateProgress(
      videoInfo.value.vod_id,
      currentTime,
      currentEpisodeIndex,
      episodes.value[currentEpisodeIndex]
    )
  }
}

onMounted(async () => {
  await fetchVideoInfo()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center h-96">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>

    <!-- 播放器区域 -->
    <div v-else class="space-y-8">
      <!-- 视频播放器 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <Player
          :src="currentEpisode"
          :episodes="episodes"
          :current-index="currentEpisodeIndex"
          :initial-time="route.query.time ? parseFloat(route.query.time) : 0"
          @update:current-index="switchEpisode"
          @progress="updateProgress"
        />
      </div>
    </div>
  </div>
</template> 
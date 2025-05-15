<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../plugins/toast'

const route = useRoute()

const toast = useToast()

const currentEpisode = ref('')
const episodes = ref([])
const loading = ref(true)
const currentEpisodeIndex = ref(0)
const videoInfo = ref(null)

const searchResults = ref([])



// 添加计算属性处理 iframe src
const iframeSrc = computed(() => {
  if (!currentEpisode.value) {
    return window.services.parseApi.getParseApi()
  }
  return currentEpisode.value
})



const isFullscreen = ref(false)
const wrapperRef = ref(null)

const showEpisodePopover = ref(false)
const showSourcePopover = ref(false)

// 全屏切换（使用原生全屏API）
const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await wrapperRef.value.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (err) {
    toast.error('全屏切换失败')
  }
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 获取视频信息和历史恢复
const fetchVideoInfo = async () => {
  try {
    const id = route.params.id
    // 1. 恢复历史
    if (route.query.from === 'history') {
      currentEpisodeIndex.value = Number(route.query.episodeIndex) || 0
      currentEpisode.value = route.query.episodeUrl || ''
      videoInfo.value = {
        vod_id: route.query.vod_id,
        vod_name: route.query.title,
        sourceId: route.query.sourceId,
        sourceName: route.query.sourceName,
        platform: route.query.platform || '',
        episodeIndex: currentEpisodeIndex.value,
        episodeUrl: currentEpisode.value,
        keyword: route.query.keyword,
        episodes: route.query.episodes ? JSON.parse(route.query.episodes) : []
      }
      // 恢复剧集列表
      if (videoInfo.value.episodes && videoInfo.value.episodes.length > 0) {
        episodes.value = videoInfo.value.episodes
      } else {
        await fetchSourceList()
      }
      loading.value = false
      return
    }
    // 2. 正常搜索/播放
    // 先获取详情，提取分集
    const detail = await window.services.video.getDetail(id, route.query.sourceId)
    episodes.value = detail.episodes || []
    currentEpisodeIndex.value = 0
    currentEpisode.value = episodes.value[0] || ''
    videoInfo.value = {
      vod_id: id,
      vod_name: route.query.title,
      sourceId: route.query.sourceId,
      sourceName: route.query.sourceName,
      platform: detail.platform || '',
      episodeIndex: 0,
      episodeUrl: currentEpisode.value,
      keyword: route.query.keyword,
      episodes: [] // 这里先空，addHistory时再处理
    }
    await fetchSourceList()
    // 自动添加第一集历史记录
    const historyObj = { ...videoInfo.value, episodes: JSON.parse(JSON.stringify(episodes.value)) }
    console.log('addHistory fetchVideoInfo', historyObj)
    window.services.history.addHistory(historyObj)
  } catch (e) {
    toast.error('获取视频信息失败')
  } finally {
    loading.value = false
  }
}

// 获取可用源列表（优先用用户原始搜索词）
const fetchSourceList = async () => {
  // 优先使用route.query.keyword（用户搜索词），否则用title
  const keyword = route.query.keyword || route.query.title
  const result = await window.services.video.search(keyword)
  searchResults.value = result.list || []
}



// 选集切换
const selectEpisode = (idx) => {
  currentEpisodeIndex.value = idx
  currentEpisode.value = episodes.value[idx]
  videoInfo.value.episodeIndex = idx
  videoInfo.value.episodeUrl = currentEpisode.value
  // 记录历史
  const historyObj = { ...videoInfo.value, episodes: JSON.parse(JSON.stringify(episodes.value)) }
  console.log('addHistory selectEpisode', historyObj)
  window.services.history.addHistory(historyObj)
}

// 换源切换
const switchSource = async (item) => {
  loading.value = true
  try {
    // 获取新源详情
    const detail = await window.services.video.getDetail(item.vod_id, item.sourceId)
    episodes.value = detail.episodes || []
    // 记录当前正在播放的集数
    const prevEpisodeIndex = currentEpisodeIndex.value
    let targetIndex = 0
    // 判断新源集数是否足够
    if (episodes.value.length > prevEpisodeIndex) {
      targetIndex = prevEpisodeIndex
    } else {
      // 新源集数不足，toast提示
      toast.info('新源集数与原源不一致，已为您切换到第1集，请手动选择')
      targetIndex = 0
    }
    currentEpisodeIndex.value = targetIndex
    currentEpisode.value = episodes.value[targetIndex] || ''
    videoInfo.value = {
      vod_id: item.vod_id,
      vod_name: item.vod_name,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      platform: detail.platform || '',
      episodeIndex: targetIndex,
      episodeUrl: currentEpisode.value,
      keyword: route.query.keyword,
      episodes: [] // 这里先空，addHistory时再处理
    }
    // 记录历史
    const historyObj = { ...videoInfo.value, episodes: JSON.parse(JSON.stringify(episodes.value)) }
    console.log('addHistory switchSource', historyObj)
    window.services.history.addHistory(historyObj)
  } catch (e) {
    console.log(e)
    toast.error('切换源失败')
  } finally {
    loading.value = false
  }
}

// 点击空白处关闭弹窗
const handleClickOutside = (e) => {
  if (
    !e.target.closest('.episode-popover') &&
    !e.target.closest('.source-popover') &&
    !e.target.closest('.episode-btn') &&
    !e.target.closest('.source-btn')
  ) {
    showEpisodePopover.value = false
    showSourcePopover.value = false
  }
}

onMounted(async () => {
  await fetchVideoInfo()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div id="player">
    <div ref="wrapperRef"
      class="player-fullscreen-wrapper flex flex-col w-full max-w-5xl mx-auto rounded-lg bg-black opacity-90 shadow-lg overflow-hidden"
      :class="isFullscreen ? 'fixed inset-0 z-100 w-screen h-screen max-w-none' : ''">
      <!-- 视频播放器 -->
      <div class="w-full aspect-video relative flex-shrink-0 flex-1">
        <iframe :src="iframeSrc" class="w-full h-full absolute left-0 top-0 z-0" frameborder="0" allowfullscreen></iframe>
      </div>
      <!-- 控制栏紧贴视频区域下方 -->
      <div class="flex justify-center p-0 flex-shrink-0">
        <div
          class="bg-black bg-opacity-60 rounded-full p-0 shadow-lg flex items-center w-full max-w-[320px] min-w-[180px] overflow-hidden">
          <!-- 选集按钮 -->
          <button
            class="episode-btn flex-1 h-12 rounded-none flex items-center justify-center text-white hover:bg-black/80 transition bg-transparent min-w-0"
            aria-label="选集" @click.stop="showEpisodePopover = !showEpisodePopover; showSourcePopover = false">
            <i class="i-ri-list-unordered text-2xl"></i>
          </button>
          <!-- 换源按钮 -->
          <button
            class="source-btn flex-1 h-12 rounded-none flex items-center justify-center text-white hover:bg-black/80 transition bg-transparent min-w-0 border-l border-white/10"
            aria-label="换源" @click.stop="showSourcePopover = !showSourcePopover; showEpisodePopover = false">
            <i class="i-ri-global-line text-2xl"></i>
          </button>
          <!-- 全屏按钮 -->
          <button @click="toggleFullscreen"
            class="flex-1 h-12 rounded-none flex items-center justify-center text-white hover:bg-black/80 transition bg-transparent min-w-0 border-l border-white/10"
            aria-label="全屏">
            <i :class="isFullscreen ? 'i-ri-fullscreen-exit-line' : 'i-ri-fullscreen-line'" class="text-2xl"></i>
          </button>
        </div>
      </div>
      <!-- 选集弹出层 -->
      <div v-if="showEpisodePopover"
        class="episode-popover absolute bottom-24 left-1/2 -translate-x-1/2 z-140 bg-black bg-opacity-80 rounded-lg shadow-lg p-4 min-w-56 max-h-80 overflow-y-auto transition-opacity scroll-bar">
        <div class="text-white font-bold mb-2">选集</div>
        <button v-for="(ep, idx) in episodes" :key="idx" @click="selectEpisode(idx); showEpisodePopover = false" :class="[
          'w-full text-left px-4 py-2 rounded mb-1 bg-transparent',
          idx === currentEpisodeIndex ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-700 text-white'
        ]">
          第{{ idx + 1 }}集
        </button>
      </div>
      <!-- 换源弹出层 -->
      <div v-if="showSourcePopover"
        class="source-popover absolute bottom-24 left-1/2 -translate-x-1/2 z-140 bg-black bg-opacity-80 rounded-lg shadow-lg p-4 min-w-56 max-h-80 overflow-y-auto transition-opacity">
        <div class="text-white font-bold mb-2">换源</div>
        <div v-for="item in searchResults" :key="item.vod_id + '-' + item.sourceId"
          @click="switchSource(item); showSourcePopover = false" :class="[
            'w-full text-left px-4 py-2 rounded mb-1 flex items-center gap-2',
            item.vod_id === videoInfo?.vod_id && item.sourceId === videoInfo?.sourceId
              ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-700 text-white'
          ]">
          <span class="truncate max-w-[120px]">{{ item.vod_name }}</span>
          <span class="text-xs px-2 py-1 bg-gray-900 text-gray-300 rounded">{{ item.sourceName }}</span>
          <span v-if="item.platform" class="text-xs px-2 py-1 bg-green-900 text-green-300 rounded">{{ item.platform
            }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.scroll-bar::-webkit-scrollbar {
  display: none;
}
</style>

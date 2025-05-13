<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Hls from 'hls.js'
import { useToast } from '../../plugins/toast'
import ProgressBar from './components/ProgressBar.vue'
import VolumeControl from './components/VolumeControl.vue'
import EpisodeList from './components/EpisodeList.vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  episodes: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  initialTime: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:currentIndex', 'progress'])

const { toast } = useToast()
const videoRef = ref(null)
const containerRef = ref(null)
const isLoading = ref(true)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const isFullscreen = ref(false)
const showControls = ref(true)
const controlsTimeout = ref(null)
const playbackRate = ref(1)
const showSpeedMenu = ref(false)

const hlsInstance = ref(null)

// 播放速度选项
const speedOptions = [
  { value: 0.5, label: '0.5x' },
  { value: 1.0, label: '1.0x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2.0x' }
]

// 组件卸载状态
const isUnmounted = ref(false)

// 初始化播放器
const initPlayer = () => {
  if (!props.src) return
  isLoading.value = true
  if (Hls.isSupported()) {
    if (hlsInstance.value) {
      hlsInstance.value.destroy()
    }
    const hls = new Hls()
    hls.loadSource(props.src)
    hls.attachMedia(videoRef.value)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      isLoading.value = false
      if (props.initialTime > 0) {
        videoRef.value.currentTime = props.initialTime
      }
      videoRef.value.play()
      isPlaying.value = true
    })
    hls.on(Hls.Events.ERROR, (event, data) => {
      toast.error('视频加载失败，请稍后重试')
      isLoading.value = false
    })
    hlsInstance.value = hls
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoRef.value.src = props.src
    videoRef.value.addEventListener('loadedmetadata', () => {
      isLoading.value = false
      if (props.initialTime > 0) {
        videoRef.value.currentTime = props.initialTime
      }
      videoRef.value.play()
      isPlaying.value = true
    })
  } else {
    toast.error('当前浏览器不支持 m3u8 播放')
    isLoading.value = false
  }
}

// 播放/暂停
const togglePlay = () => {
  if (videoRef.value.paused) {
    videoRef.value.play()
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

// 更新进度
const updateProgress = () => {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  duration.value = videoRef.value.duration
}

// 保存当前进度
const saveProgress = () => {
  if (videoRef.value && !isUnmounted.value) {
    emit('progress', videoRef.value.currentTime, props.currentIndex)
  }
}

// 跳转到指定时间
const seekTo = (time) => {
  videoRef.value.currentTime = time
}

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    containerRef.value.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 切换静音
const toggleMute = () => {
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

// 设置音量
const setVolume = (value) => {
  videoRef.value.volume = value
  volume.value = value
  isMuted.value = value === 0
}

// 切换剧集
const switchEpisode = (index) => {
  // 保存当前进度
  saveProgress()
  emit('update:currentIndex', index)
}

// 显示/隐藏控制栏
const showControlsBar = () => {
  showControls.value = true
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value)
  }
  controlsTimeout.value = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

// 自动播放下一集
const handleEnded = () => {
  if (props.currentIndex < props.episodes.length - 1) {
    emit('update:currentIndex', props.currentIndex + 1)
  } else {
    // 可选：无下一集时弹出提示
    toast.info('已经是最后一集')
  }
}

// 切换播放速度
const changePlaybackRate = (rate) => {
  videoRef.value.playbackRate = rate
  playbackRate.value = rate
  showSpeedMenu.value = false
}

// 监听视频源变化
watch(() => props.src, () => {
  if (!isUnmounted.value) {
    initPlayer()
  }
})

// 监听全屏变化
const handleFullscreenChange = () => {
  if (!isUnmounted.value) {
    isFullscreen.value = !!document.fullscreenElement
  }
}

onMounted(() => {
  initPlayer()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  isUnmounted.value = true
  
  // 保存最终进度
  if (videoRef.value) {
    emit('progress', videoRef.value.currentTime, props.currentIndex)
  }
  
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="video-container w-full aspect-video bg-black relative"
    @mousemove="showControlsBar"
    @mouseleave="showControls = false"
  >
    <video
      ref="videoRef"
      :poster="poster"
      class="w-full h-full"
      @timeupdate="updateProgress"
      @ended="handleEnded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    >
      您的浏览器不支持 m3u8 播放，请使用 Safari 或安卓浏览器。
    </video>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>

    <!-- 控制栏 -->
    <div
      v-show="showControls"
      class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300"
    >
      <ProgressBar
        :current-time="currentTime"
        :duration="duration"
        @seek="seekTo"
      />
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center space-x-4">
          <button
            class="text-white hover:text-blue-400 transition-colors"
            style="background: none; border: none; box-shadow: none;"
            @click="togglePlay"
          >
            <i :class="isPlaying ? 'i-ri-pause-fill' : 'i-ri-play-fill'" class="text-2xl"></i>
          </button>
          <VolumeControl
            :volume="volume"
            :is-muted="isMuted"
            @update:volume="setVolume"
            @toggle-mute="toggleMute"
          />
          <span class="text-white text-sm">
            {{ Math.floor(currentTime / 60) }}:{{ Math.floor(currentTime % 60).toString().padStart(2, '0') }} /
            {{ Math.floor(duration / 60) }}:{{ Math.floor(duration % 60).toString().padStart(2, '0') }}
          </span>
        </div>
        <div class="flex items-center space-x-4">
          <!-- 播放速度控制 -->
          <div class="relative">
            <button
              class="text-white bg-transparent hover:text-blue-400 transition-colors flex items-center space-x-1"
              @click="showSpeedMenu = !showSpeedMenu"
            >
              <i class="i-ri-speed-up-line text-2xl"></i>
              <span class="text-sm">{{ playbackRate }}x</span>
            </button>
            <!-- 速度选项菜单 -->
            <div
              v-show="showSpeedMenu"
              class="absolute bottom-full right-0 mb-2 bg-black/80 rounded-lg p-2 min-w-[80px]"
            >
              <button
                v-for="option in speedOptions"
                :key="option.value"
                class="w-full px-3 py-2 text-left text-sm text-white hover:text-blue-400 rounded transition-colors bg-transparent"
                :class="{ 'bg-blue-500 text-white': playbackRate === option.value }"
                @click="changePlaybackRate(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <EpisodeList
            :episodes="episodes"
            :current-index="currentIndex"
            @switch="switchEpisode"
          />
          <button
            class="text-white hover:text-blue-400 transition-colors"
            style="background: none; border: none; box-shadow: none;"
            @click="toggleFullscreen"
          >
            <i :class="isFullscreen ? 'i-ri-fullscreen-exit-fill' : 'i-ri-fullscreen-fill'" class="text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
}

.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style> 
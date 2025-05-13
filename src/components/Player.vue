<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Hls from 'hls.js'
import { useToast } from '../plugins/toast'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  }
})

const { toast } = useToast()
const videoRef = ref(null)
const isLoading = ref(true)
const hlsInstance = ref(null)

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
      videoRef.value.play()
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
      videoRef.value.play()
    })
  } else {
    toast.error('当前浏览器不支持 m3u8 播放')
    isLoading.value = false
  }
}

watch(() => props.src, () => {
  initPlayer()
})

onMounted(() => {
  initPlayer()
})

onBeforeUnmount(() => {
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
})
</script>

<template>
  <div class="video-container w-full aspect-video bg-black relative">
    <video
      ref="videoRef"
      :poster="poster"
      controls
      autoplay
      class="w-full h-full"
      style="background: #000;"
    >
      您的浏览器不支持 m3u8 播放，请使用 Safari 或安卓浏览器。
    </video>
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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
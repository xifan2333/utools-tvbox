<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  volume: {
    type: Number,
    required: true
  },
  isMuted: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:volume', 'toggle-mute'])

const volumeRef = ref(null)
const isDragging = ref(false)
const showVolumeSlider = ref(false)
const dragPosition = ref(0)

const volumeIcon = computed(() => {
  if (props.isMuted || props.volume === 0) return 'i-ri-volume-mute-fill'
  if (props.volume < 0.5) return 'i-ri-volume-down-fill'
  return 'i-ri-volume-up-fill'
})

// 处理点击外部区域关闭
const handleClickOutside = (event) => {
  if (showVolumeSlider.value && !event.target.closest('.volume-control')) {
    showVolumeSlider.value = false
  }
}

// 切换音量滑块显示状态
const toggleVolumeSlider = (event) => {
  event.stopPropagation()
  showVolumeSlider.value = !showVolumeSlider.value
}

const handleMouseDown = (event) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
  updateDragPosition(event)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event) => {
  if (isDragging.value) {
    updateDragPosition(event)
  }
}

const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false
    const volume = dragPosition.value / 100
    emit('update:volume', volume)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

const updateDragPosition = (event) => {
  if (!volumeRef.value) return
  const rect = volumeRef.value.getBoundingClientRect()
  const position = Math.max(0, Math.min(100, 100 - ((event.clientY - rect.top) / rect.height) * 100))
  dragPosition.value = position
}

const handleClick = (event) => {
  if (!isDragging.value) {
    updateDragPosition(event)
    const volume = dragPosition.value / 100
    emit('update:volume', volume)
  }
}

const toggleMute = (event) => {
  event.stopPropagation()
  emit('toggle-mute')
}

// 组件挂载时添加点击外部区域监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative group volume-control">
    <!-- 音量按钮 -->
    <button
      class="text-white hover:text-blue-400 transition-colors"
      style="background: none; border: none; box-shadow: none;"
      @click="toggleMute"
      @mouseenter="showVolumeSlider = true"
    >
      <i :class="[volumeIcon, 'text-2xl']"></i>
    </button>

    <!-- 音量滑块 -->
    <div
      v-show="showVolumeSlider"
      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 rounded-lg p-2"
      @click.stop
    >
      <div
        ref="volumeRef"
        class="w-2 h-24 bg-gray-600 rounded-full cursor-pointer relative"
        @mousedown="handleMouseDown"
        @click="handleClick"
      >
        <!-- 音量滑块背景 -->
        <div class="absolute inset-0 bg-gray-600 rounded-full"></div>
        
        <!-- 当前音量 -->
        <div
          class="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full transition-all duration-100"
          :style="{ height: `${isDragging ? dragPosition : volume * 100}%` }"
        ></div>
        
        <!-- 拖动时的预览 -->
        <div
          v-if="isDragging"
          class="absolute -left-8 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded"
          :style="{ bottom: `${dragPosition}%` }"
        >
          {{ Math.round(dragPosition) }}%
        </div>
      </div>
    </div>
  </div>
</template> 
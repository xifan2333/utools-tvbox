<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  currentTime: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['seek'])

const progressRef = ref(null)
const isDragging = ref(false)
const dragPosition = ref(0)

const progress = computed(() => {
  if (props.duration === 0) return 0
  return (props.currentTime / props.duration) * 100
})

const handleMouseDown = (event) => {
  event.preventDefault()
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
    const time = (dragPosition.value / 100) * props.duration
    emit('seek', time)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

const updateDragPosition = (event) => {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const position = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
  dragPosition.value = position
}

const handleClick = (event) => {
  if (!isDragging.value) {
    updateDragPosition(event)
    const time = (dragPosition.value / 100) * props.duration
    emit('seek', time)
  }
}

// 格式化时间
const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 组件卸载时清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    ref="progressRef"
    class="w-full h-1 bg-gray-600 rounded-full cursor-pointer relative group"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    <!-- 进度条背景 -->
    <div class="absolute inset-0 bg-gray-600 rounded-full"></div>
    
    <!-- 已播放进度 -->
    <div
      class="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-100"
      :style="{ width: `${isDragging ? dragPosition : progress}%` }"
    ></div>
    
    <!-- 拖动时的预览时间 -->
    <div
      v-if="isDragging"
      class="absolute -top-8 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded"
      :style="{ left: `${dragPosition}%` }"
    >
      {{ formatTime((dragPosition / 100) * duration) }}
    </div>
    
    <!-- 悬停时的进度预览 -->
    <div
      v-else
      class="absolute -top-8 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      :style="{ left: `${progress}%` }"
    >
      {{ formatTime(currentTime) }}
    </div>
  </div>
</template> 
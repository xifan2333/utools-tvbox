<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  episodes: {
    type: Array,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['switch'])

const showEpisodeList = ref(false)
const episodeListRef = ref(null)

const toggleEpisodeList = () => {
  showEpisodeList.value = !showEpisodeList.value
}

const switchEpisode = (index) => {
  emit('switch', index)
  showEpisodeList.value = false
}

// 计算显示的剧集范围


watch(showEpisodeList, (val) => {
  if (val && episodeListRef.value) {
    // 等待下一个 tick，确保 DOM 已渲染
    setTimeout(() => {
      const activeBtn = episodeListRef.value.querySelector('.bg-blue-500')
      if (activeBtn) {
        activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }, 0)
  }
})
</script>

<template>
  <div class="relative">
    <!-- 选集按钮 -->
    <button
      class="text-white hover:text-blue-400 transition-colors flex items-center space-x-1 bg-transparent"
      @click="toggleEpisodeList"
    >
      <i class="i-ri-list-unordered text-2xl"></i>
      <span class="text-sm">第 {{ currentIndex + 1 }} 集</span>
    </button>

    <!-- 选集列表 -->
    <div
      v-show="showEpisodeList"
      ref="episodeListRef"croller
er

      class="absolute bottom-full right-0 mb-2 bg-black/80 rounded-lg p-2 min-w-[120px] max-h-64 overflow-y-auto scroller"
    >
      <div class="max-h-48 ">
        <button
          v-for="(episode, index) in episodes"
          :key="index"
          class="w-full px-3 py-2 text-left text-sm text-white hover:text-blue-400 rounded transition-colors bg-transparent"
          :class="{ 'bg-blue-500 text-white': currentIndex === index }"
          @click="switchEpisode(index)"
        >
          第 {{ index + 1 }} 集
        </button>
      </div>
    </div>
  </div>
</template> 
<style scoped>
.scroller::-webkit-scrollbar-track-piece{
  background-color: rgba(0, 0, 0, 0.8);
}
.scroller::-webkit-scrollbar-thumb{
  background-color: rgba(255, 255, 255, 0.5);
  border:none;
}
.scroller::-webkit-scrollbar-thumb:hover{
  background-color: rgba(255, 255, 255, 0.8);
}
</style>

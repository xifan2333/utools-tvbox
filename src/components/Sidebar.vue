<script setup>
import { ref } from 'vue'
import logo from '@/assets/logo.png'
const isCollapsed = ref(true)

const props = defineProps({
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-theme'])

const menuItems = [
  {
    name: '搜索',
    path: '/search',
    icon: 'i-ri-search-line'
  },
  {
    name: '历史',
    path: '/history',
    icon: 'i-ri-history-line'
  },
  {
    name: '设置',
    path: '/settings',
    icon: 'i-ri-settings-line'
  }
]

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const toggleTheme = () => {
  emit('toggle-theme')
}
</script>

<template>
  <div 
    class="h-screen flex flex-col bg-light-600 dark:bg-gray-800 text-dark dark:text-gray-200 transition-all duration-300"
    :class="isCollapsed ? 'w-16' : 'w-64'"
  >
    <!-- 顶部 header -->
    <div class="p-4 flex items-center justify-between">
      <div 
        class="flex items-center gap-2 transition-all duration-300"
        :class="[
          isCollapsed
            ? 'w-0 p-0 m-0 opacity-0 scale-95 pointer-events-none'
            : 'w-auto opacity-100 scale-100',
          'overflow-hidden'
        ]"
        style="transition-property: width, opacity, transform, margin, padding;"
      >
        <img :src="logo" class="w-10 h-10 rounded-lg">
        <h1 class="text-xl font-bold whitespace-nowrap">TV Box</h1>
      </div>
      <button 
        @click="toggleSidebar"
        class="p-2 bg-light-700 dark:bg-gray-700 hover:bg-light-800 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <i :class="isCollapsed ? 'i-ri-menu-fold-line' : 'i-ri-menu-unfold-line'" class="text-xl"></i>
      </button>
    </div>

    <!-- 主菜单区 -->
    <nav class="mt-4 flex-1 overflow-auto">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center px-4 py-3 hover:bg-light-700 dark:hover:bg-gray-700 transition-colors"
        :class="{ 'justify-center': isCollapsed }"
        active-class="bg-light-700 dark:bg-gray-700"
      >
        <i :class="[item.icon, 'text-xl']"></i>
        <span v-show="!isCollapsed" class="ml-3">{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- 底部亮暗模式按钮 -->
    <div class="p-4 flex justify-center">
      <button 
        @click="toggleTheme"
        class="p-2 bg-light-700 dark:bg-gray-700 hover:bg-light-800 dark:hover:bg-gray-600 rounded-lg transition-colors"
        :title="isDark ? '切换为亮色模式' : '切换为暗色模式'"
      >
        <i :class="isDark ? 'i-ri-sun-line' : 'i-ri-moon-line'" class="text-xl"></i>
      </button>
    </div>
  </div>
</template> 
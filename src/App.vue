<script setup>
import { onMounted, ref, watch } from 'vue';
import { useToast } from './plugins/toast';
import Sidebar from './components/Sidebar.vue';

const isDark = ref(false)

// 初始化主题
onMounted(() => {
  const theme = window.services.theme.getTheme()
  isDark.value = theme === 'dark'
  updateTheme()
})

// 监听主题变化
watch(isDark, (newValue) => {
  updateTheme()
  window.services.theme.setTheme(newValue ? 'dark' : 'light')
})

// 更新主题
const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value
}
</script>

<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <Sidebar :is-dark="isDark" @toggle-theme="toggleTheme" />
    <main class="flex-1 overflow-auto p-4">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

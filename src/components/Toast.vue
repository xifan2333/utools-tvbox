<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  },
  position: {
    type: String,
    default: 'top',
    validator: (value) => ['top', 'bottom', 'center'].includes(value)
  }
})

const visible = ref(false)
const timer = ref(null)

const typeIcons = {
  success: 'i-ri-checkbox-circle-line',
  warning: 'i-ri-alert-line',
  error: 'i-ri-close-circle-line',
  info: 'i-ri-information-line'
}

const typeColors = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-gray-500'
}

const show = () => {
  visible.value = true
  if (props.duration > 0) {
    if (timer.value) {
      clearTimeout(timer.value)
    }
    timer.value = setTimeout(() => {
      visible.value = false
    }, props.duration)
  }
}

watch(() => props.message, () => {
  show()
})

onMounted(() => {
  show()
})

onUnmounted(() => {
  if (timer.value) {
    clearTimeout(timer.value)
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-2 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-2 opacity-0"
  >
    <div
      v-show="visible"
      class="fixed left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
      :class="[
        typeColors[type],
        position === 'top' ? 'top-4' : position === 'bottom' ? 'bottom-4' : 'top-1/2 -translate-y-1/2'
      ]"
    >
      <i :class="[typeIcons[type], 'text-white text-xl']"></i>
      <span class="text-white">{{ message }}</span>
    </div>
  </Transition>
</template> 
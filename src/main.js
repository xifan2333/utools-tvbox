import { createApp } from "vue";

import App from "./App.vue"
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'
import ToastPlugin from './plugins/toast'
import router from './router'



const app = createApp(App)
app.use(ToastPlugin)
app.use(router)
app.mount("#app");
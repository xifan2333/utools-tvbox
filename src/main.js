import { createApp } from "vue";


import App from "./App.vue"
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'
import router from './router'
import DialogPlugin from './plugins/dialog'
import ToastPlugin from './plugins/toast'

const app = createApp(App)


app.use(ToastPlugin)
app.use(router)
app.use(DialogPlugin)
app.mount("#app");
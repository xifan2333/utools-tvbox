import { defineConfig, presetWind3, presetIcons } from 'unocss'
export default defineConfig({
    presets: [
        presetWind3({
            reset: true,
            dark: 'class'
        }),
        presetIcons({
            extraProperties: {
                'display': 'inline-block',
                'vertical-align': 'middle',
            },
            collections: {
                'ri': () => import('@iconify-json/ri/icons.json', { with: { type: 'json' } }).then(i => i.default)
            }
        }),
    
    ]
})
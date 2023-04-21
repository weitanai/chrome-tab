import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'  //如果是使用vue开发的，引入相关的插件
import crx from 'vite-plugin-crx-mv3'

export default defineConfig({
    plugins: [
        vue(),
        crx({
            manifest: './src/manifest.json'
        }),
    ]
});
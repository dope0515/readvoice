// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  devServer: {
    port: 3000,
    host: '127.0.0.1'
  },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    whisper: {
      apiBaseUrl: process.env.NUXT_WHISPER_API_URL || 'http://localhost:8000'
    },
    ollama: {
      host: process.env.NUXT_OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.NUXT_OLLAMA_MODEL || 'gemma3'
    }
  }
})

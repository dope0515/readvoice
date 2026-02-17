// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  // SSR 비활성화 (클라이언트 사이드 렌더링)
  ssr: false,
  
  devServer: {
    port: 3000,
    host: '127.0.0.1'
  },
  
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  
  runtimeConfig: {
    // 서버 측 전용 (API 키 보호)
    groqApiKey: process.env.GROQ_API_KEY || '',
    
    // 레거시 설정 (더 이상 사용 안함)
    whisper: {
      apiBaseUrl: process.env.NUXT_WHISPER_API_URL || ''
    },
    ollama: {
      host: process.env.NUXT_OLLAMA_HOST || '',
      model: process.env.NUXT_OLLAMA_MODEL || ''
    }
  },
  
  // Nitro 프리셋
  nitro: {
    preset: 'node-server'
  }
})

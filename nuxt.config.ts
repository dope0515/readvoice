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
  
  css: ['~/assets/scss/main.scss'],
  
  runtimeConfig: {
    // 서버 측 전용 (API 키 보호)
    groqApiKey: process.env.GROQ_API_KEY || '',
    resendApiKey: process.env.RESEND_API_KEY || ''
  },

  modules: [
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '읽어줄래요',
      short_name: '읽어줄래요',
      theme_color: '#ffffff',
      background_color: '#f8f9fa',
      display: 'standalone',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module'
    }
  },

  app: {
    head: {
      title: '읽어줄래요',
      htmlAttrs: {
        lang: 'ko'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        
        // 기본 SEO
        { name: 'description', content: '쉽고 빠른 음성 텍스트 변환 서비스, 읽어줄래요. 당신의 음성을 텍스트로 기록해보세요.' },
        
        // Open Graph (공유 시 보이는 정보)
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: '읽어줄래요' },
        { property: 'og:description', content: '쉽고 빠른 음성 텍스트 변환 서비스, 읽어줄래요. 당신의 음성을 텍스트로 기록해보세요.' },
        { property: 'og:image', content: '/og_image.jpg' }, // SNS 공유 시 표시될 이미지 (현재 PWA 아이콘 사용)
        { property: 'og:site_name', content: '읽어줄래요' },
        { property: 'og:locale', content: 'ko_KR' },
        
        // Twitter (X) Card
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: '읽어줄래요' },
        { name: 'twitter:description', content: '쉽고 빠른 음성 텍스트 변환 서비스, 읽어줄래요. 당신의 음성을 텍스트로 기록해보세요.' },
        { name: 'twitter:image', content: '/og_image.jpg' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '192x192', href: '/pwa-192x192.png' }
      ]
    }
  }
})

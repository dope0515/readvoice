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
    rtzr: {
      clientId: process.env.NUXT_RTZR_CLIENT_ID,
      clientSecret: process.env.NUXT_RTZR_CLIENT_SECRET,
      apiBaseUrl: process.env.NUXT_RTZR_API_BASE_URL || 'https://openapi.vito.ai/v1'
    },
    supabase: {
      url: process.env.NUXT_SUPABASE_URL,
      key: process.env.NUXT_SUPABASE_KEY
    },
    ollama: {
      host: process.env.NUXT_OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.NUXT_OLLAMA_MODEL || 'gemma3'
    },
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL,
      supabaseKey: process.env.NUXT_SUPABASE_KEY
    }
  }
})

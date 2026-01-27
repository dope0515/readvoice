<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
            <h1 class="text-2xl font-bold text-gray-900">음성-텍스트 변환 서비스</h1>
          </div>
          <div class="hidden sm:block">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              RTZR STT API
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- 탭 네비게이션 -->
        <div class="px-6 pt-6">
          <TabNavigation 
            :active-tab="activeTab" 
            @change-tab="changeTab" 
          />
        </div>

        <!-- 컨텐츠 영역 -->
        <div class="px-6 py-8">
          <transition
            mode="out-in"
            enter-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <FileUploadSTT v-if="activeTab === 'file'" />
            <RealtimeSTT v-else-if="activeTab === 'realtime'" />
          </transition>
        </div>
      </div>

      <!-- 푸터 정보 -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600">
          Powered by 
          <a href="https://developers.rtzr.ai/docs/" 
             target="_blank" 
             rel="noopener noreferrer"
             class="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            RTZR STT API
          </a>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('file')

const changeTab = (tabId) => {
  activeTab.value = tabId
}
</script>

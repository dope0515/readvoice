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
            <h1 class="text-2xl font-bold text-gray-900">읽어줄래요</h1>
            <p class="text-sm text-gray-500">(마음만은 고품격 음성-텍스트 변환 서비스)</p>
          </div>
          <div class="flex items-center space-x-4">
            <!-- 사용량 표시 -->
            <div class="flex items-center space-x-3">
              <div class="text-right">
                <p class="text-xs text-gray-500">무료 사용량</p>
                <p 
                  class="text-sm font-semibold"
                  :class="{
                    'text-blue-600': statusColor === 'blue',
                    'text-yellow-600': statusColor === 'yellow',
                    'text-red-600': statusColor === 'red'
                  }"
                >
                  {{ statusText }}
                </p>
              </div>
              <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :class="{
                    'bg-blue-500': statusColor === 'blue',
                    'bg-yellow-500': statusColor === 'yellow',
                    'bg-red-500': statusColor === 'red'
                  }"
                  :style="{ width: `${Math.min(100, usagePercentage)}%` }"
                />
              </div>
            </div>
            <span class="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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

    </main>

    <!-- 사용량 초과 모달 -->
    <UsageLimitModal 
      v-if="showLimitModal" 
      :usage="usage"
      @close="closeModal" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const activeTab = ref('file')
const showLimitModal = ref(false)

const { usage, usagePercentage, statusColor, statusText, fetchUsage } = useUsage()

let refreshInterval: any = null

onMounted(() => {
  // 클라이언트 사이드에서만 실행
  if (import.meta.client) {
    // 초기 사용량 조회 (에러 발생 시에도 앱은 계속 작동)
    fetchUsage().catch(err => {
      console.warn('초기 사용량 조회 실패:', err)
    })
    
    // 30초마다 사용량 갱신
    refreshInterval = setInterval(() => {
      fetchUsage().catch(() => {
        // 자동 갱신 실패는 조용히 무시
      })
    }, 30000)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// 사용량 초과 시 모달 표시 감시
watch(() => usage.value.isLocked, (isLocked: boolean) => {
  if (isLocked) {
    showLimitModal.value = true
  }
})

const changeTab = (tabId: string) => {
  activeTab.value = tabId
}

const closeModal = () => {
  showLimitModal.value = false
}
</script>

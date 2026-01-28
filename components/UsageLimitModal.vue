<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- 배경 오버레이 -->
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        aria-hidden="true"
        @click="$emit('close')"
      ></div>

      <!-- 중앙 정렬을 위한 트릭 -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- 모달 패널 -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <div>
          <!-- 아이콘 -->
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <!-- 내용 -->
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              무료 사용량 초과
            </h3>
            <div class="mt-4 space-y-3">
              <p class="text-sm text-gray-500">
                무료 제공 사용량 <strong>{{ usage.limitMinutes }}분</strong>을 모두 사용하셨습니다.
              </p>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-600">사용량</span>
                  <span class="text-sm font-semibold text-gray-900">
                    {{ Math.floor(usage.totalMinutes) }} / {{ usage.maxMinutes }}분
                  </span>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-red-500 rounded-full"
                    :style="{ width: '100%' }"
                  />
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-4">
                더 이상 무료로 서비스를 이용하실 수 없습니다.
              </p>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p class="text-sm text-blue-800">
                  💡 유료 플랜으로 전환하거나, 자체 RTZR API 키를 발급받아 사용하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
          <a
            href="https://developers.rtzr.ai/docs/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
          >
            RTZR API 알아보기
          </a>
          <button
            type="button"
            @click="$emit('close')"
            class="mt-3 sm:mt-0 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  usage: {
    totalMinutes: number
    limitMinutes: number
    maxMinutes: number
    remainingMinutes: number
    isLocked: boolean
    isAvailable: boolean
  }
}>()

defineEmits(['close'])
</script>

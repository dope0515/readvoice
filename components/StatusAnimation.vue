<template>
  <div class="flex flex-col items-center justify-center">
    <div class="relative">
      <!-- 이미지에 애니메이션 추가 -->
      <img
        :src="currentImage"
        :alt="currentStatus"
        class="w-100 h-32 object-contain transition-all duration-500"
        :class="animationClass"
      />
      
      <!-- 로딩 중일 때 펄스 효과 -->
      <div
        v-if="isLoading"
        class="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"
      ></div>
    </div>
    
    <!-- 상태 텍스트 -->
    <p class="mt-4 text-lg font-medium text-gray-700 animate-fade-in">
      {{ statusText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'idle' | 'converting' | 'summarizing' | 'finished'
}

const props = defineProps<Props>()

// 상태별 이미지 매핑
const statusImages = {
  idle: '/images/ic_listening.png',
  converting: '/images/ic_analyzing.png',
  summarizing: '/images/ic_summarize.png',
  finished: '/images/ic_finished.png'
}

// 상태별 텍스트
const statusTexts = {
  idle: '파일을 업로드해주세요',
  converting: '음성을 텍스트로 변환하는 중...',
  summarizing: 'AI가 요약하는 중...',
  finished: '완료!'
}

// 상태별 애니메이션 클래스
const animationClasses = {
  idle: 'scale-100',
  converting: 'animate-bounce',
  summarizing: 'animate-pulse',
  finished: 'animate-bounce scale-110'
}

const currentImage = computed(() => statusImages[props.status])
const statusText = computed(() => statusTexts[props.status])
const animationClass = computed(() => animationClasses[props.status])
const isLoading = computed(() => props.status === 'converting' || props.status === 'summarizing')
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>

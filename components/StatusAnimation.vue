<template>
  <div class="status-container">
    <div class="status-icon-wrapper">
      <img
        :src="currentImage"
        :alt="statusText"
        class="status-icon"
        :class="animationClass"
      />
      
      <div v-if="isLoading" class="status-pulse"></div>
    </div>
    
    <p class="status-text">
      {{ statusText }}
      <span v-if="status === 'converting' && progressPercentage > 0" class="status-progress-text">({{ progressPercentage }}%)</span>
    </p>

    <!-- 프로그레스 바 -->
    <div v-if="status === 'converting' && totalChunks > 1" class="progress-bar-container">
      <div class="progress-bar">
        <div class="progress-bar__fill" :style="{ width: `${progressPercentage}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'idle' | 'recording' | 'converting' | 'summarizing' | 'finished',
  mode?: 'file' | 'realtime',
  totalChunks?: number,
  processedChunks?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'file',
  totalChunks: 0,
  processedChunks: 0
})

const statusImages = {
  idle: '/images/ic_listening.png',
  recording: '/images/ic_speaking.png',
  converting: '/images/ic_analyzing.png',
  summarizing: '/images/ic_summarize.png',
  finished: '/images/ic_finished.png'
}

const statusTexts = computed(() => {
  if (props.mode === 'realtime') {
    return {
      idle: '기록을 시작하려면 클릭하세요',
      recording: '말씀 중...',
      converting: '음성 인식 중...',
      summarizing: 'AI가 요약 중...',
      finished: '변환 완료!'
    }[props.status]
  }
  return {
    idle: '대기 중',
    recording: '변환 중...', // fallback
    converting: '음성 인식 중...',
    summarizing: 'AI가 요약 중...',
    finished: '완료!'
  }[props.status]
})

const animationClasses = {
  idle: '',
  recording: 'icon-pulse',
  converting: 'icon-bounce',
  summarizing: 'icon-pulse',
  finished: 'icon-bounce-scale'
}

const currentImage = computed(() => statusImages[props.status])
const statusText = computed(() => statusTexts.value)
const animationClass = computed(() => animationClasses[props.status])
const isLoading = computed(() => ['recording', 'converting', 'summarizing'].includes(props.status))

const progressPercentage = computed(() => {
  if (props.totalChunks === 0) return 0
  return Math.max(0, Math.min(100, Math.round((props.processedChunks / props.totalChunks) * 100)))
})
</script>

<style lang="scss" scoped>
.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .status-icon-wrapper {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    max-width: 500px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .status-icon {
    object-fit: contain;
    transition: all 0.5s ease;

    &.icon-bounce {
      animation: bounce 1s infinite;
    }

    &.icon-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    &.icon-bounce-scale {
      animation: bounce 1s infinite;
      transform: scale(1.1);
    }
  }

  .status-pulse {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background-color: #60a5fa;
    opacity: 0.2;
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  .status-text {
    margin-top: 1rem;
    font-size: 1.125rem;
    font-weight: 500;
    color: #374151;
    animation: fade-in 0.5s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-progress-text {
    font-size: 0.95rem;
    color: #1a73e8;
    font-weight: 600;
  }

  .progress-bar-container {
    width: 100%;
    max-width: 250px;
    margin-top: 16px;
    animation: fade-in 0.5s ease-out;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: #e8eaed;
    border-radius: 4px;
    overflow: hidden;

    &__fill {
      height: 100%;
      background: linear-gradient(90deg, #4285F4, #1a73e8);
      border-radius: 4px;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.3) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 1.5s infinite linear;
      }
    }
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

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

@keyframes bounce {
  0%, 100% {
    transform: translateY(-8%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@keyframes ping {
  75%, 100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .2;
  }
}
</style>

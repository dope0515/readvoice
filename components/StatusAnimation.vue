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
    
    <p class="status-text">{{ statusText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'idle' | 'converting' | 'summarizing' | 'finished'
}

const props = defineProps<Props>()

const statusImages = {
  idle: '/images/ic_listening.png',
  converting: '/images/ic_analyzing.png',
  summarizing: '/images/ic_summarize.png',
  finished: '/images/ic_finished.png'
}

const statusTexts = {
  idle: '파일을 업로드해주세요',
  converting: '음성을 텍스트로 변환하는 중...',
  summarizing: 'AI가 요약하는 중...',
  finished: '완료!'
}

const animationClasses = {
  idle: '',
  converting: 'icon-bounce',
  summarizing: 'icon-pulse',
  finished: 'icon-bounce-scale'
}

const currentImage = computed(() => statusImages[props.status])
const statusText = computed(() => statusTexts[props.status])
const animationClass = computed(() => animationClasses[props.status])
const isLoading = computed(() => props.status === 'converting' || props.status === 'summarizing')
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
  }
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

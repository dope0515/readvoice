<template>
  <div class="realtime-stt">
    <!-- 녹음 상태 표시 -->
    <div class="status-indicator">
      <div class="status-indicator__badge" :class="statusBadgeClass">
        <span class="status-indicator__icon-wrapper">
          <span v-if="isRecording" class="status-indicator__ping"></span>
          <span class="status-indicator__dot" :class="{ 'status-indicator__dot--active': isRecording }"></span>
        </span>
        {{ statusText }}
      </div>
    </div>

    <!-- 녹음 컨트롤 -->
    <div class="record-control">
      <div class="model-select">
        <label for="model-select" class="model-select__label">변환 모델 선택</label>
        <select id="model-select" v-model="selectedModel" class="model-select__input" :disabled="isRecording || isProcessing">
          <option value="whisper-large-v3">일반모드</option>
          <option value="whisper-large-v3-turbo">터보모드</option>
        </select>
      </div>

      <button
        @click="toggleRecording"
        :disabled="isProcessing"
        :class="[
          'record-btn',
          isRecording ? 'record-btn--recording' : 'record-btn--idle',
          { 'record-btn--disabled': isProcessing }
        ]"
      >
        <svg v-if="!isRecording" class="record-btn__icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        <svg v-else class="record-btn__icon" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>

      <p class="record-control__hint">
        {{ isRecording ? '녹음 중지하려면 클릭' : '녹음 시작하려면 클릭' }}
      </p>
    </div>

    <!-- 녹음 시간 -->
    <div v-if="isRecording" class="record-timer">
      <p class="record-timer__text">
        {{ formatTime(recordingTime) }}
      </p>
    </div>

    <!-- 실시간 텍스트 결과 -->
    <div v-if="transcriptionText || isProcessing" class="result-box">
      <h3 class="result-box__title">
        <svg class="result-box__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        실시간 변환 결과
      </h3>
      
      <div class="result-box__content">
        <div v-if="isProcessing" class="loading-dots">
          <div class="loading-dots__dot loading-dots__dot--1"></div>
          <div class="loading-dots__dot loading-dots__dot--2"></div>
          <div class="loading-dots__dot loading-dots__dot--3"></div>
        </div>
        <p v-else class="result-box__text">
          {{ transcriptionText || '음성을 인식하는 중...' }}
        </p>
      </div>

      <div v-if="transcriptionText" class="result-box__actions">
        <button @click="clearTranscription" class="btn-clear">
          초기화
        </button>
        <div class="result-box__main-actions">
          <button
            @click="summarizeText"
            :disabled="isSummarizing"
            :class="[
              'btn-summarize',
              { 'btn-summarize--disabled': isSummarizing }
            ]"
          >
            {{ isSummarizing ? '요약 중...' : '요약하기' }}
          </button>
          <button @click="copyToClipboard" class="btn-copy">
            클립보드에 복사
          </button>
        </div>
      </div>
    </div>

    <!-- 요약 결과 -->
    <div v-if="summaryResult" class="summary-card">
      <h3 class="summary-card__title">
        <svg class="summary-card__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        AI 요약
      </h3>
      <div class="summary-card__content">
        <p class="summary-card__text">{{ summaryResult }}</p>
      </div>
    </div>

    <!-- 요약 에러 -->
    <div v-if="summaryError" class="alert alert--warning">
      <div class="alert__content">
        <svg class="alert__icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clip-rule="evenodd"/>
        </svg>
        <p class="alert__message">{{ summaryError }}</p>
      </div>
    </div>

    <!-- 권한 안내 -->
    <div v-if="showPermissionInfo" class="alert alert--info">
      <div class="alert__content">
        <svg class="alert__icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clip-rule="evenodd"/>
        </svg>
        <p class="alert__message">
          마이크 권한이 필요합니다. 브라우저에서 마이크 사용을 허용해주세요.
        </p>
      </div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="alert alert--error">
      <div class="alert__content">
        <svg class="alert__icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clip-rule="evenodd"/>
        </svg>
        <p class="alert__message">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface APIResponse {
  success: boolean
  text?: string
  transcriptionId?: string
  usedMinutes?: number
  remainingMinutes?: number
  isLocked?: boolean
}

const isRecording = ref(false)
const isProcessing = ref(false)
const recordingTime = ref(0)
const transcriptionText = ref('')
const errorMessage = ref('')
const showPermissionInfo = ref(false)
const isSummarizing = ref(false)
const summaryResult = ref('')
const summaryError = ref('')
const selectedModel = ref('whisper-large-v3')

let mediaRecorder: MediaRecorder | null = null
let recordingInterval: number | null = null
let audioChunks: Blob[] = []

const statusText = computed(() => {
  if (isProcessing.value) return '처리 중'
  if (isRecording.value) return '녹음 중'
  return '대기'
})

const statusBadgeClass = computed(() => {
  if (isProcessing.value) return 'status-indicator__badge--processing'
  if (isRecording.value) return 'status-indicator__badge--recording'
  return 'status-indicator__badge--idle'
})

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleRecording = async (): Promise<void> => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async (): Promise<void> => {
  try {
    errorMessage.value = ''
    showPermissionInfo.value = false

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      await processAudio(audioBlob)
    }

    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0

    recordingInterval = window.setInterval(() => {
      recordingTime.value++
    }, 1000)

  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showPermissionInfo.value = true
      errorMessage.value = '마이크 권한이 거부되었습니다.'
    } else {
      errorMessage.value = '마이크에 접근할 수 없습니다.'
    }
  }
}

const stopRecording = (): void => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    mediaRecorder.stream.getTracks().forEach(track => track.stop())
    isRecording.value = false
    
    if (recordingInterval) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }
  }
}

const processAudio = async (audioBlob: Blob): Promise<void> => {
  isProcessing.value = true
  errorMessage.value = ''
  
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')
    formData.append('model', selectedModel.value)
    
    const response = await $fetch<APIResponse>('/api/stt/realtime', {
      method: 'POST',
      body: formData
    } as any)
    
    if (response.success && response.text) {
      transcriptionText.value = response.text
    } else {
      throw new Error('변환 결과를 받지 못했습니다.')
    }
  } catch (error: any) {
    console.error('STT Error:', error)
    errorMessage.value = error.data?.message || error.message || '음성 처리 중 오류가 발생했습니다.'
  } finally {
    isProcessing.value = false
  }
}

const clearTranscription = (): void => {
  transcriptionText.value = ''
  recordingTime.value = 0
  summaryResult.value = ''
  summaryError.value = ''
}

const copyToClipboard = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(transcriptionText.value)
    alert('클립보드에 복사되었습니다!')
  } catch (error) {
    errorMessage.value = '클립보드 복사에 실패했습니다.'
  }
}

const summarizeText = async (): Promise<void> => {
  if (!transcriptionText.value) return
  
  isSummarizing.value = true
  summaryError.value = ''
  summaryResult.value = ''
  
  try {
    const response = await fetch('/api/summarize/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: transcriptionText.value
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '요약 생성 실패')
    }
    
    const data = await response.json()
    summaryResult.value = data.summary || '요약 생성 완료'
  } catch (error: any) {
    console.error('Summarization error:', error)
    summaryError.value = error.message || 'AI 요약에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    isSummarizing.value = false
  }
}

onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
  if (recordingInterval) {
    clearInterval(recordingInterval)
  }
})
</script>

<style lang="scss" scoped>
.realtime-stt {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-indicator {
  text-align: center;

  &__badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;

    &--processing {
      background-color: #fef9c3;
      color: #854d0e;
    }

    &--recording {
      background-color: #fee2e2;
      color: #991b1b;
    }

    &--idle {
      background-color: #f3f4f6;
      color: #1f2937;
    }
  }

  &__icon-wrapper {
    position: relative;
    display: flex;
    height: 0.75rem;
    width: 0.75rem;
    margin-right: 0.5rem;
  }

  &__ping {
    position: absolute;
    display: inline-flex;
    height: 100%;
    width: 100%;
    border-radius: 9999px;
    background-color: #f87171;
    opacity: 0.75;
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  &__dot {
    position: relative;
    display: inline-flex;
    border-radius: 9999px;
    height: 0.75rem;
    width: 0.75rem;
    background-color: #9ca3af;

    &--active {
      background-color: #ef4444;
    }
  }
}

.record-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;

  &__hint {
    font-size: 0.875rem;
    color: #4b5563;
    margin: 0;
  }
}

.model-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 24rem;

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
  }

  &__input {
    width: 100%;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    font-size: 0.875rem;
    color: #111827;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    &:disabled {
      background-color: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }
}

.record-btn {
  position: relative;
  padding: 2rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
  }

  &--idle {
    background-color: #3b82f6;
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5);

    &:hover {
      background-color: #2563eb;
    }
  }

  &--recording {
    background-color: #ef4444;
    box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.5);

    &:hover {
      background-color: #dc2626;
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      transform: none;
    }
  }

  &__icon {
    height: 3rem;
    width: 3rem;
    color: #ffffff;
  }
}

.record-timer {
  text-align: center;

  &__text {
    font-size: 1.5rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-weight: 500;
    color: #374151;
    margin: 0;
  }
}

.result-box {
  background-color: #ffffff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;

  &__title {
    font-size: 1.125rem;
    font-weight: 500;
    color: #111827;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
  }

  &__icon {
    height: 1.25rem;
    width: 1.25rem;
    color: #3b82f6;
    margin-right: 0.5rem;
  }

  &__content {
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
    min-height: 12.5rem;
    max-height: 25rem;
    overflow-y: auto;
  }

  &__text {
    color: #1f2937;
    white-space: pre-wrap;
    line-height: 1.625;
    margin: 0;
  }

  &__actions {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__main-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 8rem;
  gap: 0.5rem;

  &__dot {
    width: 0.75rem;
    height: 0.75rem;
    background-color: #3b82f6;
    border-radius: 50%;
    animation: bounce 1s infinite;

    &--1 { animation-delay: 0ms; }
    &--2 { animation-delay: 150ms; }
    &--3 { animation-delay: 300ms; }
  }
}

.btn-clear {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #1f2937;
  }
}

.btn-summarize {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease, color 0.2s ease;
  background-color: #16a34a;
  color: #ffffff;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #15803d;
  }

  &--disabled {
    background-color: #e5e7eb;
    color: #6b7280;
    cursor: not-allowed;

    &:hover {
      background-color: #e5e7eb;
    }
  }
}

.btn-copy {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #1e40af;
  }
}

.summary-card {
  background-color: #f0fdf4;
  border-radius: 0.5rem;
  border: 1px solid #bbf7d0;
  padding: 1.5rem;

  &__title {
    font-size: 1.125rem;
    font-weight: 500;
    color: #111827;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
  }

  &__icon {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem;
    color: #16a34a;
  }

  &__content {
    background-color: #ffffff;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  &__text {
    color: #1f2937;
    white-space: pre-wrap;
    margin: 0;
  }
}

.alert {
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid transparent;

  &__content {
    display: flex;
  }

  &__icon {
    height: 1.25rem;
    width: 1.25rem;
    flex-shrink: 0;
  }

  &__message {
    margin: 0 0 0 0.75rem;
    font-size: 0.875rem;
  }

  &--info {
    background-color: #eff6ff;
    border-color: #bfdbfe;

    .alert__icon {
      color: #60a5fa;
    }
    .alert__message {
      color: #1e40af;
    }
  }

  &--warning {
    background-color: #fefce8;
    border-color: #fef08a;

    .alert__icon {
      color: #facc15;
    }
    .alert__message {
      color: #9f580a;
    }
  }

  &--error {
    background-color: #fef2f2;
    border-color: #fecaca;

    .alert__icon {
      color: #f87171;
    }
    .alert__message {
      color: #991b1b;
    }
  }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
</style>

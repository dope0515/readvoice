<template>
  <div class="space-y-6">
    <!-- 녹음 상태 표시 -->
    <div class="text-center">
      <div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
          :class="statusClass">
        <span class="relative flex h-3 w-3 mr-2">
          <span v-if="isRecording" 
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3"
                :class="isRecording ? 'bg-red-500' : 'bg-gray-400'"></span>
        </span>
        {{ statusText }}
      </div>
    </div>

    <!-- 녹음 컨트롤 -->
    <div class="flex flex-col items-center space-y-4">
      <button
        @click="toggleRecording"
        :disabled="isProcessing"
        :class="[
          'relative p-8 rounded-full transition-all duration-200 transform hover:scale-105',
          isRecording
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
            : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50',
          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        <svg v-if="!isRecording" class="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        <svg v-else class="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>

      <p class="text-sm text-gray-600">
        {{ isRecording ? '녹음 중지하려면 클릭' : '녹음 시작하려면 클릭' }}
      </p>
    </div>

    <!-- 녹음 시간 -->
    <div v-if="isRecording" class="text-center">
      <p class="text-2xl font-mono font-medium text-gray-700">
        {{ formatTime(recordingTime) }}
      </p>
    </div>

    <!-- 실시간 텍스트 결과 -->
    <div v-if="transcriptionText || isProcessing" 
        class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <svg class="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        실시간 변환 결과
      </h3>
      
      <div class="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        <div v-if="isProcessing" class="flex items-center justify-center h-32">
          <div class="flex space-x-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
          </div>
        </div>
        <p v-else class="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {{ transcriptionText || '음성을 인식하는 중...' }}
        </p>
      </div>

      <div v-if="transcriptionText" class="mt-4 flex justify-between items-center">
        <button
          @click="clearTranscription"
          class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          초기화
        </button>
        <div class="flex space-x-3">
          <button
            @click="summarizeText"
            :disabled="isSummarizing"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isSummarizing
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            ]"
          >
            {{ isSummarizing ? '요약 중...' : '요약하기' }}
          </button>
          <button
            @click="copyToClipboard"
            class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            클립보드에 복사
          </button>
        </div>
      </div>
    </div>

    <!-- 요약 결과 -->
    <div v-if="summaryResult" class="bg-green-50 rounded-lg border border-green-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        AI 요약
      </h3>
      <div class="bg-white rounded-lg p-4">
        <p class="text-gray-800 whitespace-pre-wrap">{{ summaryResult }}</p>
      </div>
    </div>

    <!-- 요약 에러 -->
    <div v-if="summaryError" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clip-rule="evenodd"/>
        </svg>
        <p class="ml-3 text-sm text-yellow-800">{{ summaryError }}</p>
      </div>
    </div>

    <!-- 권한 안내 -->
    <div v-if="showPermissionInfo" 
        class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clip-rule="evenodd"/>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-blue-800">
            마이크 권한이 필요합니다. 브라우저에서 마이크 사용을 허용해주세요.
          </p>
        </div>
      </div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clip-rule="evenodd"/>
        </svg>
        <p class="ml-3 text-sm text-red-800">{{ errorMessage }}</p>
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

let mediaRecorder: MediaRecorder | null = null
let recordingInterval: number | null = null
let audioChunks: Blob[] = []

const statusText = computed(() => {
  if (isProcessing.value) return '처리 중'
  if (isRecording.value) return '녹음 중'
  return '대기'
})

const statusClass = computed(() => {
  if (isProcessing.value) return 'bg-yellow-100 text-yellow-800'
  if (isRecording.value) return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
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
    // Groq API를 통한 요약 (서버 API 사용)
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

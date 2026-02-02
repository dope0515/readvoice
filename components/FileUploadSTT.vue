<template>
  <div class="space-y-6">
    <!-- 파일 업로드 영역 -->
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      :class="[
        'border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      ]"
    >
      <!-- 상태 애니메이션 컴포넌트 -->
      <StatusAnimation :status="currentStatus" />
      
      <div class="mt-6">
        <label
          v-if="!isConverting && !isSummarizing"
          for="file-upload"
          class="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
        >
          <span>파일을 선택하거나</span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            class="sr-only"
            accept=".wav,.mp3,.m4a,.flac,.ogg,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/flac,audio/ogg"
            @change="handleFileSelect"
          />
        </label>
        <span v-if="!isConverting && !isSummarizing" class="text-gray-600"> 드래그 앤 드롭</span>
      </div>
      <p v-if="!isConverting && !isSummarizing" class="text-xs text-gray-500 mt-2">
        WAV, MP3, M4A, FLAC, OGG 파일 지원
      </p>
    </div>

    <!-- 업로드된 파일 정보 -->
    <div v-if="selectedFile" class="bg-gray-50 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <svg
            class="h-8 w-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
        <button
          @click="removeFile"
          class="text-red-600 hover:text-red-800 transition-colors"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 변환 버튼 -->
    <div v-if="selectedFile" class="flex justify-center">
      <button
        @click="convertToText"
        :disabled="isConverting"
        :class="[
          'px-6 py-3 rounded-lg font-medium text-white transition-colors duration-200',
          isConverting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        ]"
      >
        {{ isConverting ? '변환 중...' : '텍스트로 변환' }}
      </button>
    </div>

    <!-- 변환 결과 -->
    <div v-if="transcriptionResult" class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">변환 결과</h3>
      <div class="bg-gray-50 rounded-lg p-4 min-h-[200px]">
        <p class="text-gray-800 whitespace-pre-wrap">{{ transcriptionResult }}</p>
      </div>
      <div class="mt-4 flex justify-end space-x-3">
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

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <p class="ml-3 text-sm text-red-800">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface APIResponse {
  success: boolean
  text?: string
  transcriptionId?: string
  usedMinutes?: number
  remainingMinutes?: number
  isLocked?: boolean
}

// 허용된 오디오 파일 확장자 및 MIME 타입
const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
const ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',      // m4a 파일용
  'audio/x-m4a',    // m4a 파일용
  'audio/flac',
  'audio/ogg',
  'audio/vorbis'
]

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const isConverting = ref(false)
const transcriptionResult = ref('')
const errorMessage = ref('')
const isSummarizing = ref(false)
const summaryResult = ref('')
const summaryError = ref('')

// 현재 상태 계산
const currentStatus = computed(() => {
  if (isSummarizing.value) return 'summarizing'
  if (isConverting.value) return 'converting'
  if (transcriptionResult.value && summaryResult.value) return 'finished'
  return 'idle'
})

// 파일 유효성 검사 함수
const isValidAudioFile = (file: File): boolean => {
  // 확장자 검사
  const fileName = file.name.toLowerCase()
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
  
  // MIME 타입 검사
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())
  
  // MP4 동영상 차단 (video/mp4 타입)
  if (file.type.toLowerCase().startsWith('video/')) {
    return false
  }
  
  return hasValidExtension || hasValidMimeType
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (isValidAudioFile(file)) {
      selectedFile.value = file
      errorMessage.value = ''
    } else {
      errorMessage.value = '지원하지 않는 파일 형식입니다. WAV, MP3, M4A, FLAC, OGG 파일만 업로드 가능합니다.'
      selectedFile.value = null
    }
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const file = files[0]
    if (isValidAudioFile(file)) {
      selectedFile.value = file
      errorMessage.value = ''
    } else {
      errorMessage.value = '지원하지 않는 파일 형식입니다. WAV, MP3, M4A, FLAC, OGG 파일만 업로드 가능합니다.'
      selectedFile.value = null
    }
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    target.value = ''
  }
}

const removeFile = () => {
  selectedFile.value = null
  transcriptionResult.value = ''
  errorMessage.value = ''
  summaryResult.value = ''
  summaryError.value = ''
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const convertToText = async (): Promise<void> => {
  if (!selectedFile.value) return
  
  isConverting.value = true
  errorMessage.value = ''
  transcriptionResult.value = ''
  
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    const response = await $fetch<APIResponse>('/api/stt/upload', {
      method: 'POST',
      body: formData
    } as any)
    
    if (response.success && response.text) {
      transcriptionResult.value = response.text
    } else {
      throw new Error('변환 결과를 받지 못했습니다.')
    }
  } catch (error: any) {
    console.error('STT Error:', error)
    errorMessage.value = error.data?.message || error.message || '파일 변환 중 오류가 발생했습니다.'
  } finally {
    isConverting.value = false
  }
}

const copyToClipboard = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(transcriptionResult.value)
    alert('클립보드에 복사되었습니다!')
  } catch (error) {
    errorMessage.value = '클립보드 복사에 실패했습니다.'
  }
}

const summarizeText = async (): Promise<void> => {
  if (!transcriptionResult.value) return
  
  isSummarizing.value = true
  summaryError.value = ''
  summaryResult.value = ''
  
  try {
    const response = await $fetch<{ success: boolean; summary: string }>('/api/summarize/text', {
      method: 'POST',
      body: { text: transcriptionResult.value }
    } as any)
    
    if (response.success && response.summary) {
      summaryResult.value = response.summary
    }
  } catch (error: any) {
    summaryError.value = error.data?.message || '요약 생성에 실패했습니다.'
  } finally {
    isSummarizing.value = false
  }
}
</script>

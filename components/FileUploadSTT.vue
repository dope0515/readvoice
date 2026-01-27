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
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div class="mt-4">
        <label
          for="file-upload"
          class="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
        >
          <span>파일을 선택하거나</span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            class="sr-only"
            accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
            @change="handleFileSelect"
          />
        </label>
        <span class="text-gray-600"> 드래그 앤 드롭</span>
      </div>
      <p class="text-xs text-gray-500 mt-2">
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
      <div class="mt-4 flex justify-end">
        <button
          @click="copyToClipboard"
          class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          클립보드에 복사
        </button>
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

<script setup>
import { ref } from 'vue'

const isDragging = ref(false)
const selectedFile = ref(null)
const isConverting = ref(false)
const transcriptionResult = ref('')
const errorMessage = ref('')

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    selectedFile.value = files[0]
    errorMessage.value = ''
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    selectedFile.value = files[0]
    errorMessage.value = ''
  }
}

const removeFile = () => {
  selectedFile.value = null
  transcriptionResult.value = ''
  errorMessage.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const convertToText = async () => {
  if (!selectedFile.value) return
  
  isConverting.value = true
  errorMessage.value = ''
  
  try {
    // TODO: RTZR STT API 연동 구현
    // 현재는 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000))
    transcriptionResult.value = '여기에 변환된 텍스트가 표시됩니다.\n\nAPI 연동 후 실제 음성 인식 결과가 나타납니다.'
  } catch (error) {
    errorMessage.value = '파일 변환 중 오류가 발생했습니다.'
  } finally {
    isConverting.value = false
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(transcriptionResult.value)
    alert('클립보드에 복사되었습니다!')
  } catch (error) {
    errorMessage.value = '클립보드 복사에 실패했습니다.'
  }
}
</script>

<template>
  <div class="file-upload">
    <!-- 파일 업로드 영역 -->
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      :class="[
        'upload-dropzone',
        { 'upload-dropzone--dragging': isDragging }
      ]"
    >
      <StatusAnimation :status="currentStatus" />
      
      <div class="upload-dropzone__input-wrapper" v-if="!isConverting && !isSummarizing">
        <label
          for="file-upload"
          class="upload-dropzone__label"
        >
          <span>파일을 선택하거나</span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            class="upload-dropzone__input"
            accept=".wav,.mp3,.m4a,.flac,.ogg,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/flac,audio/ogg"
            @change="handleFileSelect"
          />
        </label>
        <span class="upload-dropzone__text"> 드래그 앤 드롭</span>
      </div>
      <p v-if="!isConverting && !isSummarizing" class="upload-dropzone__hint">
        WAV, MP3, M4A, FLAC, OGG 파일 지원
      </p>
    </div>

    <!-- 업로드된 파일 정보 -->
    <div v-if="selectedFile" class="file-info">
      <div class="file-info__content">
        <div class="file-info__details">
          <svg
            class="file-info__icon"
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
            <p class="file-info__name">{{ selectedFile.name }}</p>
            <p class="file-info__size">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
        <button
          @click="removeFile"
          class="file-info__remove"
        >
          <svg class="file-info__remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 모델 선택 및 변환 버튼 -->
    <div v-if="selectedFile" class="action-container">
      <div class="model-select">
        <label for="model-select" class="model-select__label">변환 모델 선택</label>
        <select id="model-select" v-model="selectedModel" class="model-select__input" :disabled="isConverting">
          <option value="whisper-large-v3">일반모드</option>
          <option value="whisper-large-v3-turbo">터보모드</option>
        </select>
      </div>

      <button
        @click="convertToText"
        :disabled="isConverting"
        :class="[
          'btn-convert',
          { 'btn-convert--disabled': isConverting }
        ]"
      >
        {{ isConverting ? '변환 중...' : '텍스트로 변환' }}
      </button>
    </div>

    <!-- 변환 결과 -->
    <div v-if="transcriptionResult" class="result-card">
      <h3 class="result-card__title">변환 결과</h3>
      <div class="result-card__content">
        <p class="result-card__text">{{ transcriptionResult }}</p>
      </div>
      <div class="result-card__actions">
        <button @click="copyToClipboard" class="btn-secondary">
          복사
        </button>
        <div class="result-card__main-actions">
           <button
            @click="summarizeText('summary')"
            :disabled="isSummarizing"
            :class="[
              'btn-primary',
              { 'btn-primary--disabled': isSummarizing }
            ]"
          >
            요약하기
          </button>
          
          <div class="meeting-minutes-wrapper">
            <input 
              v-model="attendeesInput" 
              type="text" 
              class="attendees-input" 
              placeholder="참석자 입력 (선택)"
              :disabled="isSummarizing"
            />
            <button
              @click="summarizeText('meeting_minutes')"
              :disabled="isSummarizing"
              :class="[
                'btn-primary btn-primary--dark',
                { 'btn-primary--disabled': isSummarizing }
              ]"
            >
              회의록 작성
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 요약/회의록 결과 -->
    <div v-if="summaryResult" class="summary-card" id="summary-print-area">
      <h3 class="summary-card__title">
        <svg class="summary-card__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        {{ summaryMode === 'meeting_minutes' ? '회의록 결과' : 'AI 요약 결과' }}
      </h3>
      
      <!-- 일반 요약 -->
      <div v-if="summaryMode === 'summary'" class="summary-card__content" v-html="formattedSummaryResult"></div>
      
      <!-- 회의록 테이블 -->
      <div v-if="summaryMode === 'meeting_minutes' && parsedMeetingMinutes" class="summary-card__content meeting-table-wrapper">
        <table class="meeting-table">
          <tbody>
            <tr>
              <th>회의 주제</th>
              <td>{{ parsedMeetingMinutes.topic }}</td>
            </tr>
            <tr>
              <th>회의 일시</th>
              <td>{{ parsedMeetingMinutes.date }}</td>
            </tr>
            <tr>
              <th>참석자</th>
              <td>{{ parsedMeetingMinutes.attendees }}</td>
            </tr>
            <tr>
              <th>주요 논의 사항</th>
              <td>
                <ul>
                  <li v-for="(item, i) in parsedMeetingMinutes.discussions" :key="i">{{ item }}</li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>결정 사항</th>
              <td>
                <ul>
                  <li v-for="(item, i) in parsedMeetingMinutes.decisions" :key="i">{{ item }}</li>
                </ul>
              </td>
            </tr>
            <tr class="action-items-row">
              <th>추후 진행 사항</th>
              <td>
                <ul>
                  <li v-for="(item, i) in parsedMeetingMinutes.actionItems" :key="i">{{ item }}</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="summary-card__actions no-print">
        <button v-if="summaryMode === 'meeting_minutes'" @click="exportToPdf" class="btn-action">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          PDF 저장
        </button>
        <button v-if="summaryMode === 'meeting_minutes'" @click="exportToExcel" class="btn-action">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          EXCEL 저장
        </button>
        <button v-if="summaryMode === 'summary'" @click="downloadSummary" class="btn-action">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          TXT 저장
        </button>
        <button @click="sendEmail" class="btn-action">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          메일 보내기
        </button>
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

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="alert alert--error">
      <div class="alert__content">
        <svg class="alert__icon" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <p class="alert__message">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusAnimation from './StatusAnimation.vue'

interface APIResponse {
  success: boolean
  text?: string
  transcriptionId?: string
  usedMinutes?: number
  remainingMinutes?: number
  isLocked?: boolean
}

const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
const ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
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
const selectedModel = ref('whisper-large-v3')
const summaryMode = ref<'summary' | 'meeting_minutes'>('summary')
const attendeesInput = ref('')

const parsedMeetingMinutes = computed(() => {
  if (summaryMode.value === 'meeting_minutes' && summaryResult.value) {
    try {
      return JSON.parse(summaryResult.value)
    } catch (e) {
      console.error('JSON parsing failed for meeting minutes', e)
      return null
    }
  }
  return null
})

const formattedSummaryResult = computed(() => {
  if (!summaryResult.value) return ''
  let html = summaryResult.value.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\n/g, '<br>')
  return `<div class="formatted-text">${html}</div>`
})

const currentStatus = computed(() => {
  if (isSummarizing.value) return 'summarizing'
  if (isConverting.value) return 'converting'
  if (transcriptionResult.value && summaryResult.value) return 'finished'
  return 'idle'
})

const isValidAudioFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase()
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())
  
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
    formData.append('model', selectedModel.value)
    
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

const summarizeText = async (mode: 'summary' | 'meeting_minutes' = 'summary'): Promise<void> => {
  if (!transcriptionResult.value) return
  
  isSummarizing.value = true
  summaryError.value = ''
  summaryResult.value = ''
  summaryMode.value = mode
  
  try {
    const response = await fetch('/api/summarize/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: transcriptionResult.value,
        mode,
        attendees: mode === 'meeting_minutes' ? attendeesInput.value : '',
        date: mode === 'meeting_minutes' ? new Date().toLocaleString('ko-KR') : ''
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

const downloadSummary = () => {
  if (!summaryResult.value) return
  const contentToSave = summaryMode.value === 'meeting_minutes' ? JSON.stringify(JSON.parse(summaryResult.value), null, 2) : summaryResult.value
  const blob = new Blob([contentToSave], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = summaryMode.value === 'meeting_minutes' ? `회의록_${new Date().getTime()}.txt` : `요약_${new Date().getTime()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const exportToPdf = () => {
  window.print()
}

const exportToExcel = () => {
  if (!parsedMeetingMinutes.value) return
  const data = parsedMeetingMinutes.value
  
  const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`
  const arrayToBulletCsv = (arr: string[]) => escapeCsv((arr || []).map(item => `- ${item}`).join('\n'))
  
  const csvRows = [
    ['항목', '내용'],
    ['회의 주제', escapeCsv(data.topic)],
    ['회의 일시', escapeCsv(data.date)],
    ['참석자', escapeCsv(data.attendees)],
    ['주요 논의 사항', arrayToBulletCsv(data.discussions)],
    ['결정 사항', arrayToBulletCsv(data.decisions)],
    ['추후 진행 사항', arrayToBulletCsv(data.actionItems)]
  ]
  
  const bom = '\uFEFF'
  const csvContent = bom + csvRows.map(e => e.join(',')).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `회의록_${new Date().getTime()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const sendEmail = () => {
  if (!summaryResult.value) return
  const subject = encodeURIComponent(summaryMode.value === 'meeting_minutes' ? '회의록 공유' : '음성 요약 공유')
  
  let content = summaryResult.value
  if (summaryMode.value === 'meeting_minutes' && parsedMeetingMinutes.value) {
    const data = parsedMeetingMinutes.value
    content = `[회의 주제]: ${data.topic}\n[일시]: ${data.date}\n[참석자]: ${data.attendees}\n\n[논의 사항]\n${data.discussions.map((d: string) => `- ${d}`).join('\n')}\n\n[결정 사항]\n${data.decisions.map((d: string) => `- ${d}`).join('\n')}\n\n[Action Items]\n${data.actionItems.map((d: string) => `- ${d}`).join('\n')}`
  }

  const body = encodeURIComponent(content)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}
</script>

<style lang="scss" scoped>
.file-upload {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.upload-dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 3rem;
  text-align: center;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: #9ca3af;
  }

  &--dragging {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  &__input-wrapper {
    margin-top: 1.5rem;
  }

  &__label {
    position: relative;
    cursor: pointer;
    border-radius: 0.375rem;
    font-weight: 500;
    color: #2563eb;
    transition: color 0.2s ease;

    &:hover {
      color: #3b82f6;
    }

    &:focus-within {
      outline: none;
    }
  }

  &__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  &__text {
    color: #4b5563;
  }

  &__hint {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
}

.file-info {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__details {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__icon {
    height: 2rem;
    width: 2rem;
    color: #3b82f6;
  }

  &__name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
    margin: 0;
  }

  &__size {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
  }

  &__remove {
    color: #dc2626;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: #991b1b;
    }
  }

  &__remove-icon {
    height: 1.25rem;
    width: 1.25rem;
  }
}

.action-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
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

.btn-convert {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  color: #ffffff;
  background-color: #2563eb;
  transition: background-color 0.2s ease;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #1d4ed8;
  }

  &--disabled {
    background-color: #9ca3af;
    cursor: not-allowed;

    &:hover {
      background-color: #9ca3af;
    }
  }
}

.result-card {
  background-color: #ffffff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;

  &__title {
    font-size: 1.125rem;
    font-weight: 500;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  &__content {
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
    min-height: 12.5rem;
  }

  &__text {
    color: #1f2937;
    white-space: pre-wrap;
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
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
}

.meeting-minutes-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f3f4f6;
  padding: 0.25rem 0.25rem 0.25rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;

  .attendees-input {
    border: none;
    background: transparent;
    font-size: 0.875rem;
    color: #111827;
    outline: none;
    width: 140px;

    &::placeholder {
      color: #9ca3af;
    }
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
}

.btn-primary {
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

  &--dark {
    background-color: #4f46e5;
    &:hover { background-color: #4338ca; }
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

.btn-secondary {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2563eb;
  background-color: #eff6ff;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: #dbeafe;
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
    line-height: 1.625;

    // v-html 포맷팅 클래스
    :deep(strong) {
      color: #16a34a;
      font-weight: 600;
    }
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    justify-content: flex-end;
  }
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #16a34a;
  background-color: #dcfce7;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #bbf7d0;
  }

  &__icon {
    width: 1.125rem;
    height: 1.125rem;
  }
}

/* 회의록 테이블 스타일 */
.meeting-table-wrapper {
  overflow-x: auto;
}

.meeting-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
  text-align: left;
  border: 1px solid #e5e7eb;

  th, td {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #374151;
    width: 25%;
    border-right: 1px solid #e5e7eb;
    vertical-align: top;
  }

  td {
    color: #1f2937;
    vertical-align: top;
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;
    
    li {
      margin-bottom: 0.25rem;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  tr:last-child th,
  tr:last-child td {
    border-bottom: none;
  }

  .action-items-row th {
    color: #b45309;
    background-color: #fffbeb;
  }
}

/* 프린트 시 CSS 설정 (PDF 변환) */
@media print {
  body * {
    visibility: hidden;
  }
  #summary-print-area, #summary-print-area * {
    visibility: visible;
  }
  #summary-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
    box-shadow: none;
    padding: 0;
  }
  #summary-print-area .no-print {
    display: none !important;
  }
}

.alert {
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid transparent;

  &__content {
    display: flex;
    align-items: center;
  }

  &__icon {
    height: 1.25rem;
    width: 1.25rem;
  }

  &__message {
    margin: 0 0 0 0.75rem;
    font-size: 0.875rem;
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
</style>

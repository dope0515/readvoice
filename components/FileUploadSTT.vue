<template>
  <div class="file-upload">
    <!-- 파일 업로드 영역 -->
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      role="region"
      aria-label="파일 업로드 영역"
      :class="[
        'upload-dropzone',
        { 'upload-dropzone--dragging': isDragging }
      ]"
    >
      <StatusAnimation :status="currentStatus" mode="file" :totalChunks="totalChunks" :processedChunks="processedChunks" />
      
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
            accept=".wav,.mp3,.m4a,.flac,.ogg"
            @change="handleFileSelect"
            aria-describedby="file-upload-hint"
          />
        </label>
        <span class="upload-dropzone__text"> 드래그 앤 드롭</span>
      </div>
      <p v-if="!isConverting && !isSummarizing" id="file-upload-hint" class="upload-dropzone__hint">
        WAV, MP3, M4A, FLAC, OGG 파일 지원 (최대 100MB)
      </p>
    </div>

    <!-- 업로드된 파일 정보 -->
    <div v-if="selectedFile" class="file-info" role="status" aria-live="polite">
      <div class="file-info__content">
        <div class="file-info__details">
          <svg class="file-info__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <div>
            <p class="file-info__name">{{ selectedFile.name }}</p>
            <p class="file-info__size">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
        <button @click="removeFile" class="file-info__remove" aria-label="파일 제거">
          <svg class="file-info__remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        :class="['btn-convert', { 'btn-convert--disabled': isConverting }]"
      >
        {{ isConverting ? '텍스트로 변환 중...' : '텍스트로 변환' }}
      </button>
    </div>

    <!-- 변환 결과 -->
    <div v-if="transcriptionResult" class="result-card" id="tabpanel-file" role="tabpanel" aria-labelledby="tab-file">
      <h3 class="result-card__title">변환 결과</h3>
      <div class="result-card__content" role="region" aria-label="변환된 텍스트">
        <!-- 화자 구분 뷰 -->
        <div v-if="diarizationResult && diarizationResult.length > 0" class="diarization-view">
          <div
            v-for="(segment, i) in diarizationResult"
            :key="i"
            class="diarization-segment"
            :class="`diarization-segment--${getSpeakerIndex(segment.speaker)}`"
          >
            <span class="diarization-segment__speaker">{{ segment.speaker }}</span>
            <p class="diarization-segment__text">{{ segment.text }}</p>
          </div>
        </div>
        <!-- 일반 텍스트 뷰 (문단 분리) -->
        <div v-else class="transcription-paragraphs">
          <p
            v-for="(para, i) in formattedTranscriptionParagraphs"
            :key="i"
            class="transcription-para"
          >{{ para }}</p>
        </div>
      </div>
      <div class="result-card__actions">
        <button @click="copyToClipboard" class="btn-secondary">복사</button>
        <div class="result-card__main-actions">
          <button
            @click="stt.formatText(transcriptionResult)"
            :disabled="isSummarizing"
            :class="['btn-format', { 'btn-format--disabled': isSummarizing }]"
          >
            텍스트 정리
          </button>
          <button
            @click="stt.diarize(transcriptionResult)"
            :disabled="isSummarizing"
            :class="['btn-diarize', { 'btn-diarize--disabled': isSummarizing }]"
          >
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
            </svg>
            {{ diarizationResult ? '화자구분 초기화' : '화자 구분' }}
          </button>

          <button
            @click="handleSummarize('summary')"
            :disabled="isSummarizing"
            :class="['btn-primary', { 'btn-primary--disabled': isSummarizing }]"
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
              @click="handleSummarize('meeting_minutes')"
              :disabled="isSummarizing"
              :class="['btn-primary btn-primary--dark', { 'btn-primary--disabled': isSummarizing }]"
            >
              회의록 작성
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 요약/회의록 결과 -->
    <div v-if="summaryResult" class="summary-card">
      <h3 class="summary-card__title">
        <svg class="summary-card__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        {{ summaryMode === 'meeting_minutes' ? '회의록 결과' : 'AI 요약 결과' }}
      </h3>
      
      <div v-if="summaryMode === 'summary'" class="summary-card__content" v-html="formattedSummaryResult"></div>
      
      <div v-if="summaryMode === 'meeting_minutes' && parsedMeetingMinutes" class="summary-card__content meeting-table-wrapper" id="meeting-minutes-area">
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

      <div class="summary-card__actions">
        <button v-if="summaryMode === 'meeting_minutes'" @click="handleExportPdf" class="btn-action" :disabled="isExportingPdf">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          {{ isExportingPdf ? 'PDF 생성 중...' : 'PDF 저장' }}
        </button>
        <button v-if="summaryMode === 'meeting_minutes'" @click="handleExportExcel" class="btn-action">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          EXCEL 저장
        </button>
        <button v-if="summaryMode === 'summary'" @click="downloadSummary" class="btn-action">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          TXT 저장
        </button>
        <button @click="handleSendEmail" class="btn-action">
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
          <path fill-rule="evenodd"
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
import { useSTT } from '~/composables/useSTT'
import { formatFileSize } from '~/utils/audio'
import { exportToPdf, exportToExcel, sendEmail } from '~/utils/export'

const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
const MAX_FILE_SIZE = 100 * 1024 * 1024

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const selectedModel = ref('whisper-large-v3')
const attendeesInput = ref('')
const isExportingPdf = ref(false)
const summaryMode = ref<'summary' | 'meeting_minutes'>('summary')

const stt = useSTT()
const {
  isConverting,
  isSummarizing,
  transcriptionResult,
  summaryResult,
  summaryError,
  diarizationResult,
  totalChunks,
  processedChunks,
  getSpeakerIndex
} = stt

const errorMessage = ref('')

// STT 텍스트를 문단 단위로 나누기
const formattedTranscriptionParagraphs = computed(() => {
  if (!transcriptionResult.value) return []
  const text = transcriptionResult.value.trim()
  if (text.includes('\n\n')) {
    return text.split('\n\n').filter(p => p.trim())
  }
  const sentences = text.match(/[^.!?。]+[.!?。]+\s*/g) || [text]
  const chunkSize = 3
  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += chunkSize) {
    paragraphs.push(sentences.slice(i, i + chunkSize).join('').trim())
  }
  return paragraphs.filter(p => p)
})

const parsedMeetingMinutes = computed(() => {
  if (summaryResult.value && summaryMode.value === 'meeting_minutes') {
    try {
      const parsed = JSON.parse(summaryResult.value)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch {
      return null
    }
  }
  return null
})

const formattedSummaryResult = computed(() => {
  if (!summaryResult.value || summaryMode.value === 'meeting_minutes') return ''
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
  return ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processSelectedFile(files[0])
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    processSelectedFile(files[0])
    target.value = ''
  }
}

const processSelectedFile = (file: File) => {
  if (!isValidAudioFile(file)) {
    errorMessage.value = '지원하지 않는 파일 형식입니다.'
    selectedFile.value = null
  } else if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = '파일 크기는 100MB를 초과할 수 없습니다.'
    selectedFile.value = null
  } else {
    selectedFile.value = file
    errorMessage.value = ''
    stt.resetSTT()
  }
}

const removeFile = () => {
  selectedFile.value = null
  stt.resetSTT()
  errorMessage.value = ''
}

const handleSummarize = async (mode: 'summary' | 'meeting_minutes') => {
  summaryMode.value = mode
  await stt.summarize(transcriptionResult.value, mode, mode === 'meeting_minutes' ? attendeesInput.value : '')
}

const convertToText = async () => {
  if (!selectedFile.value) return
  try {
    errorMessage.value = ''
    await stt.transcribeAudioChunks(selectedFile.value, selectedModel.value)
  } catch (error: any) {
    if (error.statusCode === 429 || error.message?.includes('Rate limit')) {
      errorMessage.value = 'API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    } else {
      errorMessage.value = error.message || '파일 변환 중 오류가 발생했습니다.'
    }
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(transcriptionResult.value)
    alert('클립보드에 복사되었습니다!')
  } catch {
    errorMessage.value = '클립보드 복사에 실패했습니다.'
  }
}

const handleExportPdf = async () => {
  isExportingPdf.value = true
  try {
    await exportToPdf('meeting-minutes-area', `회의록_${new Date().getTime()}`)
  } catch (e) {
    alert('PDF 생성 실패')
  } finally {
    isExportingPdf.value = false
  }
}

const handleExportExcel = () => {
  if (!parsedMeetingMinutes.value) return
  exportToExcel(parsedMeetingMinutes.value, `회의록_${new Date().getTime()}`)
}

const handleSendEmail = () => {
  if (!summaryResult.value) return
  const subject = summaryMode.value === 'meeting_minutes' ? '[회의록] 회의 결과' : '[AI 요약] 회의 내용'
  sendEmail(subject, summaryResult.value, parsedMeetingMinutes.value)
}

const downloadSummary = () => {
  if (!summaryResult.value) return
  const blob = new Blob([summaryResult.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `요약_${new Date().getTime()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style lang="scss" scoped>
.file-upload { display: flex; flex-direction: column; gap: 20px; }
.upload-dropzone {
  border: 2px dashed #dadce0; border-radius: 8px; padding: 48px 32px; text-align: center; transition: background-color 0.2s ease, border-color 0.2s ease; background-color: #ffffff;
  &:hover { border-color: #1a73e8; background-color: #f0f4ff; }
  &--dragging { border-color: #1a73e8; background-color: #e8f0fe; }
  &__input-wrapper { margin-top: 20px; }
  &__label { position: relative; cursor: pointer; border-radius: 4px; font-weight: 500; color: #1a73e8; transition: color 0.2s ease; &:hover { color: #1557b0; } &:focus-within { outline: none; } }
  &__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
  &__text { color: #5f6368; }
  &__hint { font-size: 12px; color: #80868b; margin-top: 8px; }
}
.file-info {
  background-color: #f8f9fa; border: 1px solid #e8eaed; border-radius: 8px; padding: 12px 16px;
  &__content { display: flex; align-items: center; justify-content: space-between; }
  &__details { display: flex; align-items: center; gap: 12px; }
  &__icon { height: 28px; width: 28px; color: #1a73e8; flex-shrink: 0;}
  &__name { font-size: 14px; font-weight: 500; color: #202124; margin: 0; text-overflow: ellipsis; -webkit-line-clamp: 1; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;}
  &__size { font-size: 12px; color: #5f6368; margin: 0; }
  &__remove { color: #ea4335; background: none; border: none; cursor: pointer; border-radius: 50%; padding: 4px; transition: background-color 0.15s ease; &:hover { background-color: #fce8e6; } }
  &__remove-icon { height: 18px; width: 18px; display: block; }
}
.action-container { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.model-select {
  display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; max-width: 320px;
  &__label { font-size: 12px; font-weight: 500; color: #5f6368; letter-spacing: 0.3px; }
  &__input { width: 100%; padding: 10px 14px; border-radius: 4px; border: 1px solid #dadce0; background-color: #ffffff; font-size: 14px; color: #202124; outline: none; transition: border-color 0.2s ease, box-shadow 0.15s ease; &:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15); } &:disabled { background-color: #f8f9fa; color: #80868b; cursor: not-allowed; } }
}
.btn-convert {
  padding: 10px 28px; border-radius: 4px; font-size: 14px; font-weight: 500; letter-spacing: 0.25px; color: #ffffff; background-color: #1a73e8; box-shadow: 0 1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(26,115,232,0.3); transition: background-color 0.15s ease, box-shadow 0.15s ease; border: none; cursor: pointer;
  &:hover { background-color: #1557b0; box-shadow: 0 2px 6px rgba(26,115,232,0.4); }
  &--disabled { background-color: #80868b; box-shadow: none; cursor: not-allowed; &:hover { background-color: #80868b; box-shadow: none; } }
}
.result-card {
  background-color: #ffffff; border-radius: 8px; border: 1px solid #e8eaed; padding: 20px 24px;
  &__title { font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 16px 0; letter-spacing: 0.1px; }
  &__content { background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e8eaed; padding: 16px; min-height: 200px; max-height: 420px; overflow-y: auto; }
  &__actions { margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
  &__main-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
}
.transcription-paragraphs { display: flex; flex-direction: column; gap: 12px; }
.transcription-para { color: #202124; line-height: 1.75; letter-spacing: 0.01em; font-size: 14px; margin: 0; padding-bottom: 12px; border-bottom: 1px solid #e8eaed; &:last-child { border-bottom: none; padding-bottom: 0; } }
.diarization-view { display: flex; flex-direction: column; gap: 10px; }
.diarization-segment {
  display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border-radius: 4px; border-left: 3px solid;
  &--0 { background-color: #e8f0fe; border-left-color: #4285F4; .diarization-segment__speaker { color: #1557b0; } }
  &--1 { background-color: #e6f4ea; border-left-color: #34A853; .diarization-segment__speaker { color: #137333; } }
  &--2 { background-color: #fef7e0; border-left-color: #FBBC04; .diarization-segment__speaker { color: #e37400; } }
  &--3 { background-color: #fce8e6; border-left-color: #EA4335; .diarization-segment__speaker { color: #c5221f; } }
  &--4 { background-color: #f3e8fd; border-left-color: #9334E6; .diarization-segment__speaker { color: #7627bb; } }
  &__speaker { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
  &__text { color: #202124; line-height: 1.65; margin: 0; font-size: 14px; }
}
.btn-format, .btn-diarize { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 500; background-color: transparent; border: 1px solid #dadce0; cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn-format { color: #1a73e8; &:hover { background-color: #e8f0fe; border-color: #1a73e8; } }
.btn-diarize { color: #34A853; &:hover { background-color: #e6f4ea; border-color: #34A853; } }
.btn-icon { width: 16px; height: 16px; flex-shrink: 0; }
.meeting-minutes-wrapper {
  display: flex; align-items: center; gap: 6px; background-color: #f8f9fa; padding: 3px 3px 3px 12px; border-radius: 4px; border: 1px solid #dadce0; transition: border-color 0.15s ease; &:focus-within { border-color: #1a73e8; }
  .attendees-input { border: none; background: transparent; font-size: 13px; color: #202124; outline: none; width: 150px; &::placeholder { color: #80868b; } &:disabled { cursor: not-allowed; opacity: 0.7; } }
}
.btn-primary {
  padding: 7px 16px; font-size: 13px; font-weight: 500; letter-spacing: 0.25px; border-radius: 4px; transition: background-color 0.15s ease, box-shadow 0.15s ease; background-color: #34A853; color: #ffffff; border: none; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  &:hover { background-color: #2d8f47; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
  &--dark { background-color: #1a73e8; &:hover { background-color: #1557b0; } }
  &--disabled { background-color: #dadce0; color: #80868b; cursor: not-allowed; box-shadow: none; &:hover { background-color: #dadce0; box-shadow: none; } }
}
.btn-secondary { padding: 7px 16px; font-size: 13px; font-weight: 500; color: #1a73e8; background-color: transparent; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease; &:hover { background-color: #e8f0fe; border-color: #1a73e8; } }
.summary-card {
  background-color: #ffffff; border-radius: 8px; border: 1px solid #e8eaed; border-top: 3px solid #1a73e8; padding: 20px 24px;
  &__title { font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 16px 0; display: flex; align-items: center; letter-spacing: 0.1px; }
  &__icon { width: 20px; height: 20px; margin-right: 8px; color: #1a73e8; }
  &__content { background-color: #ffffff; border-radius: 4px; padding: 0; line-height: 1.625; :deep(strong) { color: #1a73e8; font-weight: 600; } }
  &__actions { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; flex-wrap: wrap; }
}
.btn-action {
  display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; letter-spacing: 0.25px; color: #1a73e8; background-color: transparent; border: 1px solid #dadce0; cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  &:hover { background-color: #e8f0fe; border-color: #1a73e8; }
  &:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
  &__icon { width: 16px; height: 16px; }
}
.meeting-table-wrapper { overflow-x: auto; }
.meeting-table {
  width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; border: 1px solid #e8eaed; border-radius: 4px; overflow: hidden;
  th, td { padding: 14px 16px; border-bottom: 1px solid #e8eaed; }
  th { background-color: #e8f0fe; font-weight: 600; color: #1557b0; width: 22%; border-right: 1px solid #e8eaed; vertical-align: top; font-size: 13px; letter-spacing: 0.1px; }
  td { color: #202124; vertical-align: top; line-height: 1.6; }
  ul { margin: 0; padding-left: 18px; li { margin-bottom: 4px; &:last-child { margin-bottom: 0; } } }
  tr:last-child th, tr:last-child td { border-bottom: none; }
  .action-items-row th { color: #e37400; background-color: #fef7e0; }
}
.alert {
  border-radius: 4px; padding: 12px 16px; border: 1px solid transparent;
  &__content { display: flex; align-items: center; }
  &__icon { height: 20px; width: 20px; flex-shrink: 0; }
  &__message { margin: 0 0 0 12px; font-size: 14px; }
  &--warning { background-color: #fef7e0; border-color: #fdd663; .alert__icon { color: #FBBC04; } .alert__message { color: #e37400; } }
  &--error { background-color: #fce8e6; border-color: #f5c6c6; .alert__icon { color: #EA4335; } .alert__message { color: #c5221f; } }
}
</style>

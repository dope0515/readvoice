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
    <div v-if="transcriptionResult" class="stt-result-card" id="tabpanel-file" role="tabpanel" aria-labelledby="tab-file">
      <h3 class="stt-result-card__title">
        <svg class="stt-result-card__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        변환 결과
      </h3>
      <div class="stt-result-card__content" role="region" aria-label="변환된 텍스트">
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
      <div class="stt-result-card__actions">
        <button @click="copyToClipboard" class="btn-secondary">복사</button>
        <div class="stt-result-card__main-actions">
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
        <div class="email-chips-wrapper">
          <!-- 상단: 입력된 칩들 -->
          <div v-if="recipientEmails.length > 0" class="email-chips-display">
            <div v-for="(email, index) in recipientEmails" :key="index" class="email-chip">
              <span class="email-chip__text">{{ email }}</span>
              <button @click="removeEmail(index)" class="email-chip__remove" aria-label="이메일 삭제">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
              </button>
            </div>
          </div>

          <!-- 하단: 입력 영역 (단일 텍스트 입력창) -->
          <div class="email-input-group">
            <div class="email-input-fields">
              <input 
                v-model="currentEmailInput" 
                type="email" 
                class="email-full-input" 
                placeholder="이메일 주소 입력 (예: name@company.com)"
                :disabled="isSendingEmail"
                @keydown.enter.prevent="addEmail"
              />
              <button @click="addEmail" class="btn-add-email" title="추가">
                <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
              </button>
            </div>
            
            <button 
              @click="handleSendEmail" 
              class="btn-send-email" 
              :disabled="isSendingEmail || recipientEmails.length === 0"
            >
              <svg class="btn-send-email__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              {{ isSendingEmail ? '발송 중...' : `모두에게 메일 보내기 (${recipientEmails.length})` }}
            </button>
          </div>
        </div>
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
import { exportToPdf, exportToExcel, sendEmail, getFormattedFilename } from '~/utils/export'

const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
const MAX_FILE_SIZE = 100 * 1024 * 1024

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const selectedModel = ref('whisper-large-v3')
const attendeesInput = ref('')
const isExportingPdf = ref(false)
const isSendingEmail = ref(false)
const recipientEmails = ref<string[]>([])
const currentEmailInput = ref('')
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
    await exportToPdf('meeting-minutes-area', getFormattedFilename())
  } catch (e) {
    alert('PDF 생성 실패')
  } finally {
    isExportingPdf.value = false
  }
}

const handleExportExcel = () => {
  if (!parsedMeetingMinutes.value) return
  exportToExcel(parsedMeetingMinutes.value, getFormattedFilename())
}

const addEmail = () => {
  const email = currentEmailInput.value.trim()
  if (!email) return
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    alert('유효한 이메일 형식이 아닙니다.')
    return
  }
  
  if (recipientEmails.value.includes(email)) {
    currentEmailInput.value = ''
    return
  }
  
  recipientEmails.value.push(email)
  currentEmailInput.value = ''
}

const removeEmail = (index: number) => {
  recipientEmails.value.splice(index, 1)
}

const handleSendEmail = async () => {
  if (!summaryResult.value || recipientEmails.value.length === 0) return
  
  isSendingEmail.value = true
  errorMessage.value = ''
  
  try {
    const subject = summaryMode.value === 'meeting_minutes' ? '[회의록] 회의 결과' : '[AI 요약] 회의 내용'
    await sendEmail(recipientEmails.value, subject, summaryResult.value, parsedMeetingMinutes.value)
    alert('이메일이 성공적으로 발송되었습니다.\n(단, 무료 플랜인 경우 인증된 계정으로만 발송될 수 있습니다.)')
  } catch (error: any) {
    console.error(error)
    errorMessage.value = error.message || '이메일 발송 중 오류가 발생했습니다.'
  } finally {
    isSendingEmail.value = false
  }
}

const downloadSummary = () => {
  if (!summaryResult.value) return
  const blob = new Blob([summaryResult.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${getFormattedFilename('요약')}.txt`
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
  &__name { font-size: 14px; font-weight: 500; color: #202124; margin: 0; text-overflow: ellipsis; -webkit-line-clamp: 1; line-clamp: 1; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;}
  &__size { font-size: 12px; color: #5f6368; margin: 0; }
  &__remove { color: #ea4335; background: none; border: none; cursor: pointer; border-radius: 50%; padding: 4px; transition: background-color 0.15s ease; &:hover { background-color: #fce8e6; } }
  &__remove-icon { height: 18px; width: 18px; display: block; }
}
.action-container { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.btn-convert {
  padding: 10px 28px; border-radius: 4px; font-size: 14px; font-weight: 500; letter-spacing: 0.25px; color: #ffffff; background-color: #1a73e8; box-shadow: 0 1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(26,115,232,0.3); transition: background-color 0.15s ease, box-shadow 0.15s ease; border: none; cursor: pointer;
  &:hover { background-color: #1557b0; box-shadow: 0 2px 6px rgba(26,115,232,0.4); }
  &--disabled { background-color: #80868b; box-shadow: none; cursor: not-allowed; &:hover { background-color: #80868b; box-shadow: none; } }
}
</style>

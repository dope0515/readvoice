<template>
  <div class="realtime-stt">
    <!-- 녹음 상태 표시 -->
    <StatusAnimation :status="currentStatus" mode="realtime" />

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
        :disabled="activeChunkRequests > 0"
        :class="[
          'record-btn',
          isRecording ? 'record-btn--recording' : 'record-btn--idle',
          { 'record-btn--disabled': activeChunkRequests > 0 }
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
      <p class="record-timer__text">{{ formatTime(recordingTime) }}</p>
    </div>

    <!-- 실시간 텍스트 결과 -->
    <div v-if="transcriptionText || activeChunkRequests > 0" class="result-box">
      <h3 class="result-box__title">
        <svg class="result-box__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        실시간 변환 결과
      </h3>
      
      <div class="result-box__content">
        <div v-if="activeChunkRequests > 0 && !transcriptionText" class="loading-dots">
          <div class="loading-dots__dot loading-dots__dot--1"></div>
          <div class="loading-dots__dot loading-dots__dot--2"></div>
          <div class="loading-dots__dot loading-dots__dot--3"></div>
        </div>
        <template v-else>
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
        </template>
      </div>

      <div v-if="transcriptionText" class="result-box__actions">
        <button @click="clearTranscription" class="btn-clear">초기화</button>
        <div class="result-box__main-actions">
          <button v-if="masterAudioBlobs.length > 0" @click="downloadAudio" class="btn-secondary">오디오 다운로드</button>
          <button @click="copyToClipboard" class="btn-secondary">복사</button>
          <!-- 텍스트 정리 버튼 -->
          <button
            @click="formatTranscription"
            :disabled="isSummarizing"
            :class="['btn-format', { 'btn-format--disabled': isSummarizing }]"
          >
            텍스트 정리
          </button>
          <!-- 화자 구분 버튼 -->
          <button
            @click="diarizeText"
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
            @click="summarizeText('summary')"
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
              @click="summarizeText('meeting_minutes')"
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
      
      <!-- 일반 요약 -->
      <div v-if="summaryMode === 'summary'" class="summary-card__content" v-html="formattedSummaryResult"></div>
      
      <!-- 회의록 테이블 -->
      <div v-if="summaryMode === 'meeting_minutes' && parsedMeetingMinutes" class="summary-card__content meeting-table-wrapper" id="meeting-minutes-area-realtime">
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
        <button v-if="summaryMode === 'meeting_minutes'" @click="exportToPdf" class="btn-action" :disabled="isExportingPdf">
          <svg class="btn-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          {{ isExportingPdf ? 'PDF 생성 중...' : 'PDF 저장' }}
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

    <!-- 권한 안내 -->
    <div v-if="showPermissionInfo" class="alert alert--info">
      <div class="alert__content">
        <svg class="alert__icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clip-rule="evenodd"/>
        </svg>
        <p class="alert__message">마이크 권한이 필요합니다. 브라우저에서 마이크 사용을 허용해주세요.</p>
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
import StatusAnimation from './StatusAnimation.vue'

interface APIResponse {
  success: boolean
  text?: string
}

interface DiarizationSegment {
  speaker: string
  text: string
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
const masterAudioBlobs = ref<Blob[]>([])
const activeChunkRequests = ref(0)
const summaryMode = ref<'summary' | 'meeting_minutes'>('summary')
const attendeesInput = ref('')
const diarizationResult = ref<DiarizationSegment[] | null>(null)
const isExportingPdf = ref(false)

// WebM/MP4 Blob을 완전한 형태의 WAV(PCM 16-bit) Blob으로 변환
// (Groq API가 브라우저의 불완전한 WebM을 거부하는 문제 해결)
const convertBlobToWav = async (blob: Blob): Promise<Blob> => {
  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const numOfChan = audioBuffer.numberOfChannels
  const length = audioBuffer.length * numOfChan * 2 + 44
  const buffer = new ArrayBuffer(length)
  const view = new DataView(buffer)
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + audioBuffer.length * numOfChan * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numOfChan, true)
  view.setUint32(24, audioBuffer.sampleRate, true)
  view.setUint32(28, audioBuffer.sampleRate * 2 * numOfChan, true)
  view.setUint16(32, numOfChan * 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, audioBuffer.length * numOfChan * 2, true)

  let offset = 44
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = audioBuffer.getChannelData(channel)[i]
      sample = Math.max(-1, Math.min(1, sample))
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      view.setInt16(offset, sample, true)
      offset += 2
    }
  }

  return new Blob([view], { type: 'audio/wav' })
}

// 배경 녹음 유지를 위한 Wake Lock & Silence Audio
let wakeLock: any = null
let silenceAudio: HTMLAudioElement | null = null

const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await (navigator as any).wakeLock.request('screen')
      console.log('Wake Lock 활성화')
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`)
    }
  }
}

const releaseWakeLock = () => {
  if (wakeLock) {
    wakeLock.release().then(() => {
      wakeLock = null
      console.log('Wake Lock 해제')
    })
  }
}

const startSilenceLoop = () => {
  // 1초 무음 오디오 (Base64) - 브라우저가 배경에서 정지되는 것을 방지
  const silenceSrc = 'data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  if (!silenceAudio) {
    silenceAudio = new Audio(silenceSrc)
    silenceAudio.loop = true
  }
  silenceAudio.play().catch(e => console.warn('Silence audio play failed:', e))
}

const stopSilenceLoop = () => {
  if (silenceAudio) {
    silenceAudio.pause()
    silenceAudio.currentTime = 0
  }
}

// 화자 인덱스 (0~4) → 색상 클래스
const speakerMap = ref<Record<string, number>>({})
const getSpeakerIndex = (speaker: string): number => {
  if (!(speaker in speakerMap.value)) {
    const idx = Object.keys(speakerMap.value).length % 5
    speakerMap.value[speaker] = idx
  }
  return speakerMap.value[speaker]
}

// STT 텍스트를 문단 단위로 나누기
const formattedTranscriptionParagraphs = computed(() => {
  if (!transcriptionText.value) return []
  const text = transcriptionText.value.trim()
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
  if (summaryMode.value === 'meeting_minutes' && summaryResult.value) {
    try {
      return JSON.parse(summaryResult.value)
    } catch (e) {
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

let mediaRecorder: MediaRecorder | null = null
let recordingInterval: number | null = null
let chunkInterval: number | null = null
let audioChunks: Blob[] = []

const currentStatus = computed(() => {
  if (isSummarizing.value) return 'summarizing'
  if (activeChunkRequests.value > 0) return 'converting'
  if (isRecording.value) return 'recording'
  if (transcriptionText.value && summaryResult.value) return 'finished'
  return 'idle'
})

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleRecording = async (): Promise<void> => {
  if (isRecording.value) { stopRecording() } else { await startRecording() }
}

const startRecording = async (): Promise<void> => {
  try {
    errorMessage.value = ''
    showPermissionInfo.value = false
    
    let streamRef: MediaStream | null = null
    
    const startSegment = () => {
      // Create fresh recorder to ensure headers are intact for the chunk
      mediaRecorder = new MediaRecorder(streamRef!)
      audioChunks = []
      
      mediaRecorder.ondataavailable = (event: BlobEvent) => { 
        if (event.data.size > 0) audioChunks.push(event.data) 
      }
      
      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) return
        
        // 브라우저에 따라 실제 저장되는 포맷 파악 (Safari는 mp4 등)
        const mimeType = mediaRecorder!.mimeType || 'audio/webm'
        const chunkBlob = new Blob(audioChunks, { type: mimeType })
        audioChunks = []
        
        try {
          // 순수 WAV 포맷으로 변환 (Groq API 400 에러 우회)
          const wavBlob = await convertBlobToWav(chunkBlob)
          masterAudioBlobs.value.push(wavBlob)
          processChunk(wavBlob, 'wav')
        } catch (e) {
          console.error("WAV 변환 실패, 원본 전송 시도", e)
          masterAudioBlobs.value.push(chunkBlob)
          let fallbackExt = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
          processChunk(chunkBlob, fallbackExt)
        }
      }
      
      mediaRecorder.start(1000)
    }

    // Capture initial stream
    streamRef = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      } 
    })
    
    // Reset state
    masterAudioBlobs.value = []
    
    await requestWakeLock()
    startSilenceLoop()
    
    startSegment()
    
    isRecording.value = true
    recordingTime.value = 0
    recordingInterval = window.setInterval(() => { recordingTime.value++ }, 1000)
    
    // Chunking interval
    chunkInterval = window.setInterval(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        startSegment() // Start following chunk
      }
    }, 30000) // 30 seconds interval
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
  if (chunkInterval) { window.clearInterval(chunkInterval); chunkInterval = null }
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    // Stop all media tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop())
    isRecording.value = false
    
    releaseWakeLock()
    stopSilenceLoop()
    
    if (recordingInterval) { window.clearInterval(recordingInterval); recordingInterval = null }
  }
}

const processChunk = async (audioBlob: Blob, ext: string = 'webm'): Promise<void> => {
  activeChunkRequests.value++
  errorMessage.value = ''
  
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, `chunk.${ext}`)
    formData.append('model', selectedModel.value)
    
    const response = await $fetch<APIResponse>('/api/stt/realtime', { method: 'POST', body: formData } as any)
    
    if (response.success && response.text) {
      if (transcriptionText.value) {
        transcriptionText.value += '\n\n' + response.text.trim()
      } else {
        transcriptionText.value = response.text.trim()
      }
    }
  } catch (error: any) {
    errorMessage.value = error.data?.message || error.message || '음성 처리 중 오류가 발생했습니다.'
  } finally {
    activeChunkRequests.value--
  }
}

const clearTranscription = (): void => {
  transcriptionText.value = ''
  recordingTime.value = 0
  summaryResult.value = ''
  summaryError.value = ''
  masterAudioBlobs.value = []
  diarizationResult.value = null
  speakerMap.value = {}
}

const copyToClipboard = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(transcriptionText.value)
    alert('클립보드에 복사되었습니다!')
  } catch {
    errorMessage.value = '클립보드 복사에 실패했습니다.'
  }
}

// 텍스트 정리 (AI 문법 교정)
const formatTranscription = async (): Promise<void> => {
  if (!transcriptionText.value) return
  isSummarizing.value = true
  summaryError.value = ''
  diarizationResult.value = null
  speakerMap.value = {}
  try {
    const response = await fetch('/api/summarize/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcriptionText.value, mode: 'format' })
    })
    if (!response.ok) { const err = await response.json(); throw new Error(err.message || '텍스트 정리 실패') }
    const data = await response.json()
    transcriptionText.value = data.summary || transcriptionText.value
  } catch (error: any) {
    summaryError.value = error.message || '텍스트 정리에 실패했습니다.'
  } finally {
    isSummarizing.value = false
  }
}

// 화자 구분
const diarizeText = async (): Promise<void> => {
  if (diarizationResult.value) {
    diarizationResult.value = null
    speakerMap.value = {}
    return
  }
  if (!transcriptionText.value) return
  isSummarizing.value = true
  summaryError.value = ''
  try {
    const response = await fetch('/api/summarize/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcriptionText.value, mode: 'diarization' })
    })
    if (!response.ok) { const err = await response.json(); throw new Error(err.message || '화자 구분 실패') }
    const data = await response.json()
    const parsed = JSON.parse(data.summary)
    if (Array.isArray(parsed)) {
      diarizationResult.value = parsed
      speakerMap.value = {}
    }
  } catch (error: any) {
    summaryError.value = error.message || '화자 구분에 실패했습니다.'
  } finally {
    isSummarizing.value = false
  }
}

const summarizeText = async (mode: 'summary' | 'meeting_minutes' = 'summary'): Promise<void> => {
  if (!transcriptionText.value) return
  isSummarizing.value = true
  summaryError.value = ''
  summaryResult.value = ''
  summaryMode.value = mode
  try {
    const response = await fetch('/api/summarize/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: transcriptionText.value,
        mode,
        attendees: mode === 'meeting_minutes' ? attendeesInput.value : '',
        date: mode === 'meeting_minutes' ? new Date().toLocaleString('ko-KR') : ''
      })
    })
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || '요약 생성 실패') }
    const data = await response.json()
    summaryResult.value = data.summary || '요약 생성 완료'
  } catch (error: any) {
    summaryError.value = error.message || 'AI 요약에 실패했습니다.'
  } finally {
    isSummarizing.value = false
  }
}

const downloadAudio = () => {
  if (masterAudioBlobs.value.length === 0) return
  // Concatenate all tracked chunk blobs
  const finalBlob = new Blob(masterAudioBlobs.value, { type: 'audio/webm' })
  const url = URL.createObjectURL(finalBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `녹음음성_${new Date().getTime()}.wav` // .wav extension used globally although internally webm/wav browser dependent
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadSummary = () => {
  if (!summaryResult.value) return
  const blob = new Blob([summaryResult.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `요약_${new Date().getTime()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// PDF 직접 저장 (html2canvas + jsPDF)
const exportToPdf = async () => {
  if (!parsedMeetingMinutes.value) return
  isExportingPdf.value = true
  try {
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ])
    const html2canvas = html2canvasModule.default
    const { jsPDF } = jsPDFModule

    const element = document.getElementById('meeting-minutes-area-realtime')
    if (!element) throw new Error('회의록 영역을 찾을 수 없습니다.')

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= (pageHeight - margin * 2)

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= (pageHeight - margin * 2)
    }

    pdf.save(`회의록_${new Date().getTime()}.pdf`)
  } catch (error: any) {
    summaryError.value = 'PDF 저장에 실패했습니다: ' + (error.message || '')
  } finally {
    isExportingPdf.value = false
  }
}

// XLSX 저장 — 스타일드 디자인 템플릿 (SheetJS)
const exportToExcel = async () => {
  if (!parsedMeetingMinutes.value) return
  const data = parsedMeetingMinutes.value
  try {
    const XLSX = await import('xlsx')

    const headerStyle = {
      font: { bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1a73e8' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: { style: 'thin', color: { rgb: 'BBBBBB' } }, bottom: { style: 'thin', color: { rgb: 'BBBBBB' } }, left: { style: 'thin', color: { rgb: 'BBBBBB' } }, right: { style: 'thin', color: { rgb: 'BBBBBB' } } }
    }
    const thStyle = {
      font: { bold: true, sz: 11, color: { rgb: '202124' } },
      fill: { fgColor: { rgb: 'E8F0FE' } },
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
      border: { top: { style: 'thin', color: { rgb: 'C5C5C5' } }, bottom: { style: 'thin', color: { rgb: 'C5C5C5' } }, left: { style: 'thin', color: { rgb: 'C5C5C5' } }, right: { style: 'thin', color: { rgb: 'C5C5C5' } } }
    }
    const tdStyle = {
      font: { sz: 11, color: { rgb: '202124' } },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
      border: { top: { style: 'thin', color: { rgb: 'E0E0E0' } }, bottom: { style: 'thin', color: { rgb: 'E0E0E0' } }, left: { style: 'thin', color: { rgb: 'E0E0E0' } }, right: { style: 'thin', color: { rgb: 'E0E0E0' } } }
    }
    const actionStyle = { ...tdStyle, fill: { fgColor: { rgb: 'FFF8E1' } }, font: { sz: 11, color: { rgb: '5F4C00' } } }

    const rows = [
      [{ v: '회의록', t: 's', s: headerStyle }, { v: '', t: 's', s: headerStyle }],
      [{ v: '회의 주제', t: 's', s: thStyle }, { v: data.topic || '', t: 's', s: tdStyle }],
      [{ v: '회의 일시', t: 's', s: thStyle }, { v: data.date || '', t: 's', s: tdStyle }],
      [{ v: '참석자',   t: 's', s: thStyle }, { v: data.attendees || '', t: 's', s: tdStyle }],
      [{ v: '주요 논의 사항', t: 's', s: thStyle }, { v: (data.discussions || []).map((d: string) => `• ${d}`).join('\n'), t: 's', s: tdStyle }],
      [{ v: '결정 사항', t: 's', s: thStyle }, { v: (data.decisions || []).map((d: string) => `• ${d}`).join('\n'), t: 's', s: tdStyle }],
      [{ v: '추후 진행 사항', t: 's', s: thStyle }, { v: (data.actionItems || []).map((d: string) => `• ${d}`).join('\n'), t: 's', s: actionStyle }],
    ]

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 18 }, { wch: 65 }]
    ws['!rows'] = [{ hpt: 32 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 80 }, { hpt: 60 }, { hpt: 60 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '회의록')
    XLSX.writeFile(wb, `회의록_${new Date().getTime()}.xlsx`)
  } catch (error: any) {
    summaryError.value = 'Excel 저장에 실패했습니다: ' + (error.message || '')
  }
}

const sendEmail = () => {
  if (!summaryResult.value) return
  const subject = encodeURIComponent(summaryMode.value === 'meeting_minutes' ? '회의록 공유' : '음성 요약 공유')
  let content = summaryResult.value
  if (summaryMode.value === 'meeting_minutes' && parsedMeetingMinutes.value) {
    const d = parsedMeetingMinutes.value
    content = `[회의 주제]: ${d.topic}\n[일시]: ${d.date}\n[참석자]: ${d.attendees}\n\n[논의 사항]\n${(d.discussions || []).map((s: string) => `- ${s}`).join('\n')}\n\n[결정 사항]\n${(d.decisions || []).map((s: string) => `- ${s}`).join('\n')}\n\n[Action Items]\n${(d.actionItems || []).map((s: string) => `- ${s}`).join('\n')}`
  }
  const body = encodeURIComponent(content)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}

onUnmounted(() => {
  if (isRecording.value) { stopRecording() }
  if (recordingInterval) { clearInterval(recordingInterval) }
  if (chunkInterval) { clearInterval(chunkInterval) }
})
</script>

<style lang="scss" scoped>
/* Google Material Design */
.realtime-stt {
  display: flex;
  flex-direction: column;
  gap: 20px;
}



.record-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  &__hint { font-size: 13px; color: #5f6368; margin: 0; }
}

.model-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  max-width: 320px;
  &__label { font-size: 12px; font-weight: 500; color: #5f6368; letter-spacing: 0.3px; }
  &__input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 4px;
    border: 1px solid #dadce0;
    background-color: #ffffff;
    font-size: 14px;
    color: #202124;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.15s ease;
    &:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15); }
    &:disabled { background-color: #f8f9fa; color: #80868b; cursor: not-allowed; }
  }
}

.record-btn {
  position: relative;
  padding: 28px;
  border-radius: 50%;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  &:hover { transform: scale(1.05); }
  &--idle { background-color: #4285F4; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4); &:hover { background-color: #1557b0; } }
  &--recording { background-color: #EA4335; box-shadow: 0 4px 12px rgba(234, 67, 53, 0.4); &:hover { background-color: #c5221f; } }
  &--disabled { opacity: 0.5; cursor: not-allowed; &:hover { transform: none; } }
  &__icon { height: 48px; width: 48px; color: #ffffff; }
}

.record-timer {
  text-align: center;
  &__text { font-size: 24px; font-family: 'Google Sans', Roboto, monospace; font-weight: 400; color: #202124; margin: 0; letter-spacing: 2px; }
}

.result-box {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e8eaed;
  padding: 20px 24px;

  &__title { font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 16px 0; display: flex; align-items: center; letter-spacing: 0.1px; }
  &__icon { height: 20px; width: 20px; color: #4285F4; margin-right: 8px; }

  &__content {
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e8eaed;
    padding: 16px;
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
  }

  &__actions {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__main-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
}

/* 문단 분리 */
.transcription-paragraphs { display: flex; flex-direction: column; gap: 12px; }

.transcription-para {
  color: #202124;
  line-height: 1.75;
  letter-spacing: 0.01em;
  font-size: 14px;
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8eaed;
  &:last-child { border-bottom: none; padding-bottom: 0; }
}

/* 화자 구분 */
.diarization-view { display: flex; flex-direction: column; gap: 10px; }

.diarization-segment {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 4px;
  border-left: 3px solid;

  &--0 { background-color: #e8f0fe; border-left-color: #4285F4; .diarization-segment__speaker { color: #1557b0; } }
  &--1 { background-color: #e6f4ea; border-left-color: #34A853; .diarization-segment__speaker { color: #137333; } }
  &--2 { background-color: #fef7e0; border-left-color: #FBBC04; .diarization-segment__speaker { color: #e37400; } }
  &--3 { background-color: #fce8e6; border-left-color: #EA4335; .diarization-segment__speaker { color: #c5221f; } }
  &--4 { background-color: #f3e8fd; border-left-color: #9334E6; .diarization-segment__speaker { color: #7627bb; } }

  &__speaker { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
  &__text { color: #202124; line-height: 1.65; margin: 0; font-size: 14px; }
}

.loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 128px;
  gap: 8px;
  &__dot {
    width: 12px;
    height: 12px;
    background-color: #4285F4;
    border-radius: 50%;
    animation: bounce 1s infinite;
    &--1 { animation-delay: 0ms; }
    &--2 { animation-delay: 150ms; }
    &--3 { animation-delay: 300ms; }
  }
}

.btn-clear { padding: 7px 16px; font-size: 13px; font-weight: 500; color: #5f6368; background: none; border: none; cursor: pointer; transition: color 0.15s ease; &:hover { color: #202124; } }

.meeting-minutes-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f8f9fa;
  padding: 3px 3px 3px 12px;
  border-radius: 4px;
  border: 1px solid #dadce0;
  transition: border-color 0.15s ease;
  &:focus-within { border-color: #1a73e8; }
  .attendees-input {
    border: none;
    background: transparent;
    font-size: 13px;
    color: #202124;
    outline: none;
    width: 150px;
    &::placeholder { color: #80868b; }
    &:disabled { cursor: not-allowed; opacity: 0.7; }
  }
}

.btn-format {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 500;
  color: #1a73e8; background-color: transparent; border: 1px solid #dadce0;
  cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease;
  &:hover { background-color: #e8f0fe; border-color: #1a73e8; }
  &--disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-diarize {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 500;
  color: #34A853; background-color: transparent; border: 1px solid #dadce0;
  cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease;
  &:hover { background-color: #e6f4ea; border-color: #34A853; }
  &--disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-icon { width: 16px; height: 16px; flex-shrink: 0; }

.btn-primary {
  padding: 7px 16px; font-size: 13px; font-weight: 500; letter-spacing: 0.25px;
  border-radius: 4px; background-color: #34A853; color: #ffffff; border: none; cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  &:hover { background-color: #2d8f47; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
  &--dark { background-color: #1a73e8; &:hover { background-color: #1557b0; } }
  &--disabled { background-color: #dadce0; color: #80868b; cursor: not-allowed; box-shadow: none; &:hover { background-color: #dadce0; } }
}

.btn-secondary {
  padding: 7px 16px; font-size: 13px; font-weight: 500;
  color: #1a73e8; background-color: transparent; border: 1px solid #dadce0; border-radius: 4px;
  cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease;
  &:hover { background-color: #e8f0fe; border-color: #1a73e8; }
}

.summary-card {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e8eaed;
  border-top: 3px solid #1a73e8;
  padding: 20px 24px;

  &__title { font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 16px 0; display: flex; align-items: center; letter-spacing: 0.1px; }
  &__icon { width: 20px; height: 20px; margin-right: 8px; color: #1a73e8; }
  &__content {
    background-color: #ffffff;
    border-radius: 4px;
    padding: 0;
    line-height: 1.625;
    :deep(strong) { color: #1a73e8; font-weight: 600; }
  }
  &__actions { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; flex-wrap: wrap; }
}

.btn-action {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; letter-spacing: 0.25px;
  color: #1a73e8; background-color: transparent; border: 1px solid #dadce0;
  cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease;
  &:hover { background-color: #e8f0fe; border-color: #1a73e8; }
  &:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
  &__icon { width: 16px; height: 16px; }
}

.meeting-table-wrapper { overflow-x: auto; }

.meeting-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  text-align: left;
  border: 1px solid #e8eaed;
  border-radius: 4px;
  overflow: hidden;
  th, td { padding: 14px 16px; border-bottom: 1px solid #e8eaed; }
  th { background-color: #e8f0fe; font-weight: 600; color: #1557b0; width: 22%; border-right: 1px solid #e8eaed; vertical-align: top; font-size: 13px; letter-spacing: 0.1px; }
  td { color: #202124; vertical-align: top; line-height: 1.6; }
  ul { margin: 0; padding-left: 18px; li { margin-bottom: 4px; &:last-child { margin-bottom: 0; } } }
  tr:last-child th, tr:last-child td { border-bottom: none; }
  .action-items-row th { color: #e37400; background-color: #fef7e0; }
}

.alert {
  border-radius: 4px;
  padding: 12px 16px;
  border: 1px solid transparent;
  &__content { display: flex; align-items: center; }
  &__icon { height: 20px; width: 20px; flex-shrink: 0; }
  &__message { margin: 0 0 0 12px; font-size: 14px; }
  &--info { background-color: #e8f0fe; border-color: #c5d9f9; .alert__icon { color: #4285F4; } .alert__message { color: #1557b0; } }
  &--warning { background-color: #fef7e0; border-color: #fdd663; .alert__icon { color: #FBBC04; } .alert__message { color: #e37400; } }
  &--error { background-color: #fce8e6; border-color: #f5c6c6; .alert__icon { color: #EA4335; } .alert__message { color: #c5221f; } }
}

@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}
</style>


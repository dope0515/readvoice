<template>
  <div class="realtime-stt">
    <!-- 녹음 상태 표시 -->
    <StatusAnimation :status="currentStatus" mode="realtime" />

    <!-- 녹음 컨트롤 -->
    <div class="record-control">
      <div class="model-select">
        <label for="model-select" class="model-select__label">변환 모델 선택</label>
        <select id="model-select" v-model="selectedModel" class="model-select__input" :disabled="isRecording || isConverting">
          <option value="whisper-large-v3">일반모드</option>
          <option value="whisper-large-v3-turbo">터보모드</option>
        </select>
      </div>

      <!-- 볼륨 비주얼라이저 -->
      <div v-if="isRecording" class="volume-visualizer">
        <canvas ref="visualizerCanvas" width="200" height="40"></canvas>
      </div>

      <button
        @click="toggleRecording"
        :disabled="isConverting"
        :aria-label="isRecording ? '녹음 중지' : '녹음 시작'"
        :class="[
          'record-btn',
          isRecording ? 'record-btn--recording' : 'record-btn--idle',
          { 'record-btn--disabled': isConverting }
        ]"
      >
        <svg v-if="!isRecording" class="record-btn__icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        <svg v-else class="record-btn__icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>

      <p class="record-control__hint" aria-hidden="true">
        {{ isRecording ? '녹음 중지하려면 클릭' : '녹음 시작하려면 클릭' }}
      </p>
    </div>

    <!-- 녹음 시간 -->
    <div v-if="isRecording" class="record-timer" role="timer" aria-live="off">
      <p class="record-timer__text">{{ formatTime(recordingTime) }}</p>
    </div>

    <!-- 녹음 종료 후 변환 중 상태 -->
    <div v-if="isConverting" class="record-timer" role="status" aria-live="polite">
      <p class="record-timer__text">
        {{ totalChunks > 1 ? `텍스트 변환 중... (${processedChunks}/${totalChunks})` : '텍스트 변환 중...' }}
      </p>
    </div>

    <!-- 텍스트 결과 -->
    <div v-if="transcriptionResult || isConverting" class="result-box" id="tabpanel-realtime" role="tabpanel" aria-labelledby="tab-realtime">
      <h3 class="result-box__title">
        <svg class="result-box__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        녹음 인식 결과
      </h3>
      
      <div class="result-box__content">
        <div v-if="isConverting && !transcriptionResult" class="loading-dots">
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

      <div v-if="transcriptionResult" class="result-box__actions">
        <button @click="clearTranscription" class="btn-clear">초기화</button>
        <div class="result-box__main-actions">
          <button v-if="masterAudioBlob" @click="handleDownloadAudio" class="btn-secondary">오디오 다운로드</button>
          <button @click="copyToClipboard" class="btn-secondary">복사</button>
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
            @click="stt.summarize(transcriptionResult, 'summary')"
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
              @click="stt.summarize(transcriptionResult, 'meeting_minutes', attendeesInput)"
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
import { useSTT } from '~/composables/useSTT'
import { exportToPdf, exportToExcel, sendEmail } from '~/utils/export'

const isRecording = ref(false)
const recordingTime = ref(0)
const errorMessage = ref('')
const showPermissionInfo = ref(false)
const selectedModel = ref('whisper-large-v3')
const masterAudioBlob = ref<Blob | null>(null)
const attendeesInput = ref('')
const isExportingPdf = ref(false)
const summaryMode = ref<'summary' | 'meeting_minutes'>('summary')

const visualizerCanvas = ref<HTMLCanvasElement | null>(null)
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animationFrameId: number | null = null
let mediaRecorder: MediaRecorder | null = null
let recordingInterval: number | null = null
let wakeLock: any = null
let silenceAudio: HTMLAudioElement | null = null

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
  if (summaryResult.value) {
    try {
      const parsed = JSON.parse(summaryResult.value)
      if (parsed.topic) {
        summaryMode.value = 'meeting_minutes'
        return parsed
      }
    } catch {
      summaryMode.value = 'summary'
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
  if (isRecording.value) return 'recording'
  if (transcriptionResult.value && summaryResult.value) return 'finished'
  return 'idle'
})

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleRecording = async () => {
  if (isRecording.value) { stopRecording() } else { await startRecording() }
}

const startRecording = async () => {
  try {
    errorMessage.value = ''
    showPermissionInfo.value = false

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    })

    // 볼륨 비주얼라이저 설정
    setupVisualizer(stream)

    const chunks: Blob[] = []
    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      cleanupVisualizer()
      releaseWakeLock()
      stopSilenceLoop()
      if (recordingInterval) { clearInterval(recordingInterval); recordingInterval = null }
      isRecording.value = false

      if (chunks.length > 0) {
        masterAudioBlob.value = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
        await stt.transcribeAudioChunks(masterAudioBlob.value, selectedModel.value)
      }
    }

    await requestWakeLock()
    startSilenceLoop()
    
    stt.resetSTT()
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingInterval = window.setInterval(() => { recordingTime.value++ }, 1000)

  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showPermissionInfo.value = true
      errorMessage.value = '마이크 권한이 거부되었습니다.'
    } else {
      errorMessage.value = '마이크에 접근할 수 없습니다.'
    }
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
}

const setupVisualizer = (stream: MediaStream) => {
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  analyser = audioContext.createAnalyser()
  const source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)
  analyser.fftSize = 256
  
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  
  const draw = () => {
    if (!visualizerCanvas.value) return
    animationFrameId = requestAnimationFrame(draw)
    analyser?.getByteFrequencyData(dataArray)
    
    const canvas = visualizerCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const barWidth = (canvas.width / bufferLength) * 2.5
    let x = 0
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height
      ctx.fillStyle = `rgb(26, 115, 232)`
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
      x += barWidth + 1
    }
  }
  draw()
}

const cleanupVisualizer = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (audioContext) audioContext.close()
  audioContext = null
  analyser = null
}

const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try { wakeLock = await (navigator as any).wakeLock.request('screen') } catch (err) {}
  }
}

const releaseWakeLock = () => {
  if (wakeLock) { wakeLock.release().then(() => { wakeLock = null }) }
}

const startSilenceLoop = () => {
  const silenceSrc = 'data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  if (!silenceAudio) { silenceAudio = new Audio(silenceSrc); silenceAudio.loop = true }
  silenceAudio.play().catch(() => {})
}

const stopSilenceLoop = () => {
  if (silenceAudio) { silenceAudio.pause(); silenceAudio.currentTime = 0 }
}

const clearTranscription = () => {
  stt.resetSTT()
  masterAudioBlob.value = null
  recordingTime.value = 0
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(transcriptionResult.value)
    alert('클립보드에 복사되었습니다!')
  } catch {
    errorMessage.value = '클립보드 복사에 실패했습니다.'
  }
}

const handleDownloadAudio = () => {
  if (!masterAudioBlob.value) return
  const url = URL.createObjectURL(masterAudioBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `녹음음성_${new Date().getTime()}.wav`
  a.click()
  URL.revokeObjectURL(url)
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

const handleExportPdf = async () => {
  isExportingPdf.value = true
  try {
    await exportToPdf('meeting_minutes-area-realtime', `회의록_${new Date().getTime()}`)
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
  sendEmail(subject, summaryResult.value)
}

onUnmounted(() => {
  cleanupVisualizer()
  releaseWakeLock()
  stopSilenceLoop()
  if (recordingInterval) clearInterval(recordingInterval)
})
</script>

<style lang="scss" scoped>
.realtime-stt { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 12px 0; }

.record-control { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }

.volume-visualizer { width: 200px; height: 40px; background: #f8f9fa; border-radius: 4px; overflow: hidden; canvas { width: 100%; height: 100%; } }

.model-select {
  display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; max-width: 320px;
  &__label { font-size: 12px; font-weight: 500; color: #5f6368; letter-spacing: 0.3px; }
  &__input { width: 100%; padding: 10px 14px; border-radius: 4px; border: 1px solid #dadce0; background-color: #ffffff; font-size: 14px; color: #202124; outline: none; transition: border-color 0.2s ease, box-shadow 0.15s ease; &:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15); } &:disabled { background-color: #f8f9fa; color: #80868b; cursor: not-allowed; } }
}

.record-btn {
  width: 72px; height: 72px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  &__icon { width: 32px; height: 32px; }
  &--idle { background-color: #1a73e8; color: #ffffff; &:hover { background-color: #1557b0; transform: scale(1.05); } }
  &--recording { background-color: #ea4335; color: #ffffff; animation: pulse 1.5s infinite; &:hover { background-color: #d33426; } }
  &--disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
}

@keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.4); } 70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(234, 67, 53, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 67, 53, 0); } }

.record-timer { &__text { font-size: 24px; font-weight: 700; color: #202124; font-variant-numeric: tabular-nums; } }

.result-box {
  width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e8eaed; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  &__title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 16px 0; }
  &__icon { width: 20px; height: 20px; color: #1a73e8; }
  &__content { background-color: #f8f9fa; border-radius: 8px; padding: 20px; min-height: 120px; max-height: 500px; overflow-y: auto; border: 1px solid #f1f3f4; }
  &__actions { margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
  &__main-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
}

.transcription-paragraphs { display: flex; flex-direction: column; gap: 12px; }
.transcription-para { color: #202124; line-height: 1.75; font-size: 14px; margin: 0; padding-bottom: 12px; border-bottom: 1px solid #e8eaed; &:last-child { border-bottom: none; padding-bottom: 0; } }

.diarization-view { display: flex; flex-direction: column; gap: 10px; }
.diarization-segment {
  display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border-radius: 4px; border-left: 3px solid;
  &--0 { background-color: #e8f0fe; border-left-color: #4285F4; .diarization-segment__speaker { color: #1557b0; } }
  &--1 { background-color: #e6f4ea; border-left-color: #34A853; .diarization-segment__speaker { color: #137333; } }
  &--2 { background-color: #fef7e0; border-left-color: #FBBC04; .diarization-segment__speaker { color: #e37400; } }
  &--3 { background-color: #fce8e6; border-left-color: #EA4335; .diarization-segment__speaker { color: #c5221f; } }
  &--4 { background-color: #f3e8fd; border-left-color: #9334E6; .diarization-segment__speaker { color: #7627bb; } }
  &__speaker { font-size: 11px; font-weight: 600; text-transform: uppercase; }
  &__text { color: #202124; line-height: 1.65; margin: 0; font-size: 14px; }
}

.btn-format, .btn-diarize { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 500; background-color: transparent; border: 1px solid #dadce0; cursor: pointer; transition: all 0.15s ease; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn-format { color: #1a73e8; &:hover { background-color: #e8f0fe; border-color: #1a73e8; } }
.btn-diarize { color: #34A853; &:hover { background-color: #e6f4ea; border-color: #34A853; } }
.btn-icon { width: 16px; height: 16px; flex-shrink: 0; }

.meeting-minutes-wrapper {
  display: flex; align-items: center; gap: 6px; background-color: #f8f9fa; padding: 3px 3px 3px 12px; border-radius: 4px; border: 1px solid #dadce0;
  .attendees-input { border: none; background: transparent; font-size: 13px; color: #202124; outline: none; width: 150px; &::placeholder { color: #80868b; } }
}

.btn-primary {
  padding: 7px 16px; font-size: 13px; font-weight: 500; border-radius: 4px; background-color: #34A853; color: #ffffff; border: none; cursor: pointer;
  &:hover { background-color: #2d8f47; }
  &--dark { background-color: #1a73e8; &:hover { background-color: #1557b0; } }
  &--disabled { background-color: #dadce0; color: #80868b; cursor: not-allowed; }
}

.btn-secondary, .btn-clear { padding: 7px 16px; font-size: 13px; font-weight: 500; border-radius: 4px; cursor: pointer; transition: all 0.15s ease; }
.btn-secondary { color: #1a73e8; background-color: transparent; border: 1px solid #dadce0; &:hover { background-color: #f8f9fa; border-color: #1a73e8; } }
.btn-clear { color: #5f6368; background-color: transparent; border: 1px solid #dadce0; &:hover { background-color: #f1f3f4; } }

.summary-card {
  width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e8eaed; border-top: 4px solid #1a73e8; padding: 24px;
  &__title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 16px 0; }
  &__icon { width: 20px; height: 20px; color: #1a73e8; }
  &__content { font-size: 14px; line-height: 1.6; :deep(strong) { color: #1a73e8; } }
  &__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
}

.btn-action { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; color: #1a73e8; background-color: transparent; border: 1px solid #dadce0; cursor: pointer; &:hover { background-color: #f8f9fa; } &:disabled { opacity: 0.5; } }

.meeting-table-wrapper { overflow-x: auto; margin-top: 12px; }
.meeting-table {
  width: 100%; border-collapse: collapse; border: 1px solid #e8eaed;
  th, td { padding: 14px; border-bottom: 1px solid #e8eaed; font-size: 14px; }
  th { background-color: #f8f9fa; color: #5f6368; width: 120px; text-align: left; vertical-align: top; }
  td { color: #202124; }
  .action-items-row th { background-color: #fef7e0; color: #e37400; }
}

.alert {
  width: 100%; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 12px;
  &--info { background-color: #e8f0fe; color: #1a73e8; border: 1px solid #d2e3fc; }
  &--warning { background-color: #fef7e0; color: #e37400; border: 1px solid #feefc3; }
  &--error { background-color: #fce8e6; color: #d93025; border: 1px solid #fad2cf; }
  &__icon { width: 20px; height: 20px; flex-shrink: 0; }
  &__message { margin: 0; font-size: 14px; }
}

.loading-dots {
  display: flex; justify-content: center; gap: 4px; padding: 20px 0;
  &__dot {
    width: 8px; height: 8px; background-color: #dadce0; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out;
    &--1 { animation-delay: -0.32s; } &--2 { animation-delay: -0.16s; }
  }
}
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
</style>

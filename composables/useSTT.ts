import { ref, computed, type Ref } from 'vue'
import { downsampleBuffer, encodeFloat32ToWavBlob } from '../utils/audio'

export interface DiarizationSegment {
  speaker: string
  text: string
}

export interface STTState {
  isConverting: Ref<boolean>
  isSummarizing: Ref<boolean>
  transcriptionResult: Ref<string>
  summaryResult: Ref<string>
  summaryError: Ref<string>
  diarizationResult: Ref<DiarizationSegment[] | null>
  totalChunks: Ref<number>
  processedChunks: Ref<number>
}

export const useSTT = () => {
  const isConverting = ref(false)
  const isSummarizing = ref(false)
  const transcriptionResult = ref('')
  const summaryResult = ref('')
  const summaryError = ref('')
  const diarizationResult = ref<DiarizationSegment[] | null>(null)
  const totalChunks = ref(0)
  const processedChunks = ref(0)
  const speakerMap = ref<Record<string, number>>({})

  const getSpeakerIndex = (speaker: string): number => {
    if (!(speaker in speakerMap.value)) {
      const idx = Object.keys(speakerMap.value).length % 5
      speakerMap.value[speaker] = idx
    }
    return speakerMap.value[speaker]
  }

  const resetSTT = () => {
    transcriptionResult.value = ''
    summaryResult.value = ''
    summaryError.value = ''
    diarizationResult.value = null
    totalChunks.value = 0
    processedChunks.value = 0
    speakerMap.value = {}
  }

  const transcribeAudioChunks = async (fullBlob: Blob, model: string) => {
    isConverting.value = true
    totalChunks.value = 0
    processedChunks.value = 0
    
    try {
      const arrayBuffer = await fullBlob.arrayBuffer()
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const TARGET_SAMPLE_RATE = 16000
      let channelData = audioBuffer.getChannelData(0);
      if (audioBuffer.sampleRate !== TARGET_SAMPLE_RATE) {
        channelData = downsampleBuffer(channelData, audioBuffer.sampleRate, TARGET_SAMPLE_RATE)
      }

      const CHUNK_DURATION_SEC = 120 // Vercel 요량 제한(4.5MB) 내에서 요청 횟수 최소화 (약 3.84MB)
      const samplesPerChunk = TARGET_SAMPLE_RATE * CHUNK_DURATION_SEC
      const chunks: Float32Array[] = []
      for (let i = 0; i < channelData.length; i += samplesPerChunk) {
        chunks.push(channelData.slice(i, Math.min(i + samplesPerChunk, channelData.length)))
      }

      totalChunks.value = chunks.length
      let fullTranscription = ''

      for (let i = 0; i < chunks.length; i++) {
        // [추가] 과도한 RPM 방지를 위한 500ms 지연
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 500))

        const wavBlob = encodeFloat32ToWavBlob(chunks[i], TARGET_SAMPLE_RATE)
        const formData = new FormData()
        formData.append('file', wavBlob, `chunk_${i}.wav`)
        formData.append('model', model)
        if (fullTranscription) formData.append('contextPrompt', fullTranscription)
        
        // [개선] 429 에러 발생 시 자동 재시도 로직
        let retryCount = 0
        const maxRetries = 3
        let success = false

        while (!success && retryCount < maxRetries) {
          try {
            const response = await $fetch<{ success: boolean; text?: string }>('/api/stt/upload', { 
              method: 'POST', 
              body: formData 
            } as any)
            
            if (response.success && response.text) {
              fullTranscription += (fullTranscription ? '\n\n' : '') + response.text.trim()
            }
            success = true
          } catch (error: any) {
            // 429 에러인 경우 3초 대기 후 재시도
            if (error.statusCode === 429 && retryCount < maxRetries - 1) {
              console.warn(`Rate limit hit (429), retrying in 3s... (${retryCount + 1}/${maxRetries})`)
              await new Promise(resolve => setTimeout(resolve, 3000))
              retryCount++
            } else {
              throw error // 그 외 에러는 상위로 던짐
            }
          }
        }
        processedChunks.value = i + 1
      }

      transcriptionResult.value = fullTranscription
      return fullTranscription
    } finally {
      isConverting.value = false
    }
  }

  const summarize = async (text: string, mode: 'summary' | 'meeting_minutes', attendees: string = '') => {
    if (!text) return
    isSummarizing.value = true
    summaryError.value = ''
    summaryResult.value = ''
    
    try {
      const response = await fetch('/api/summarize/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          attendees,
          date: mode === 'meeting_minutes' ? new Date().toLocaleString('ko-KR') : ''
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '요약 생성 실패')
      }
      const data = await response.json()
      summaryResult.value = data.summary || '요약 생성 완료'
      return data.summary
    } catch (error: any) {
      summaryError.value = error.message || 'AI 요약에 실패했습니다.'
      throw error
    } finally {
      isSummarizing.value = false
    }
  }

  const diarize = async (text: string) => {
    if (!text) return
    isSummarizing.value = true
    summaryError.value = ''
    
    try {
      const response = await fetch('/api/summarize/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'diarization' })
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || '화자 구분 실패')
      }
      const data = await response.json()
      const parsed = JSON.parse(data.summary)
      if (Array.isArray(parsed)) {
        diarizationResult.value = parsed
        speakerMap.value = {}
      }
      return parsed
    } catch (error: any) {
      summaryError.value = error.message || '화자 구분에 실패했습니다.'
      throw error
    } finally {
      isSummarizing.value = false
    }
  }

  const formatText = async (text: string) => {
    if (!text) return
    isSummarizing.value = true
    summaryError.value = ''
    diarizationResult.value = null
    
    try {
      const response = await fetch('/api/summarize/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'format' })
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || '텍스트 정리 실패')
      }
      const data = await response.json()
      transcriptionResult.value = data.summary || transcriptionResult.value
      return data.summary
    } catch (error: any) {
      summaryError.value = error.message || '텍스트 정리에 실패했습니다.'
      throw error
    } finally {
      isSummarizing.value = false
    }
  }

  return {
    isConverting,
    isSummarizing,
    transcriptionResult,
    summaryResult,
    summaryError,
    diarizationResult,
    totalChunks,
    processedChunks,
    getSpeakerIndex,
    resetSTT,
    transcribeAudioChunks,
    summarize,
    diarize,
    formatText
  }
}

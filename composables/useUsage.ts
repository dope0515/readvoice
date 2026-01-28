import { computed } from 'vue'

interface UsageData {
  isAvailable: boolean
  totalMinutes: number
  remainingMinutes: number
  limitMinutes: number
  maxMinutes: number
  isLocked: boolean
}

// 분을 "분 초" 형식으로 변환하는 유틸리티 함수
export const formatMinutesToTime = (totalMinutes: number): string => {
  // 전체 초로 변환 (반올림으로 정확도 향상)
  const totalSeconds = Math.round(totalMinutes * 60)
  
  // 분과 초로 분리
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  if (seconds > 0) {
    return `${minutes}분 ${seconds}초`
  }
  return `${minutes}분`
}

export const useUsage = () => {
  // Nuxt 3의 useState를 사용하여 SSR-safe한 상태 관리
  const usage = useState<UsageData>('usage-data', () => ({
    isAvailable: true,
    totalMinutes: 0,
    remainingMinutes: 600,
    limitMinutes: 530,
    maxMinutes: 600,
    isLocked: false
  }))

  const isLoading = useState<boolean>('usage-loading', () => false)
  const error = useState<string | null>('usage-error', () => null)

  const fetchUsage = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await $fetch<{ success: boolean } & UsageData>('/api/usage/current')
      
      // success가 false여도 기본값이 반환되므로 업데이트
      if (data) {
        usage.value = {
          isAvailable: data.isAvailable,
          totalMinutes: data.totalMinutes,
          remainingMinutes: data.remainingMinutes,
          limitMinutes: data.limitMinutes,
          maxMinutes: data.maxMinutes,
          isLocked: data.isLocked
        }
        
        // success가 false면 경고 표시 (에러는 아님)
        if (!data.success) {
          console.warn('Usage tracking not available, using default values')
        }
      }
    } catch (err: any) {
      // 네트워크 에러 등의 경우에만 에러 처리
      console.error('Failed to fetch usage:', err)
      error.value = err.message || '사용량 조회에 실패했습니다.'
      
      // 에러 발생 시에도 기본값 유지 (이미 초기화되어 있음)
      // 앱은 계속 작동
    } finally {
      isLoading.value = false
    }
  }

  // 사용률 (퍼센트)
  const usagePercentage = computed(() => {
    return (usage.value.totalMinutes / usage.value.maxMinutes) * 100
  })

  // 색상 (남은 시간에 따라)
  const statusColor = computed(() => {
    const remaining = usage.value.remainingMinutes
    if (remaining > 200) return 'blue'
    if (remaining > 100) return 'yellow'
    return 'red'
  })

  // 상태 텍스트
  const statusText = computed(() => {
    if (usage.value.isLocked) return '사용 불가'
    if (usage.value.remainingMinutes <= 0) return '한도 초과'
    return `${formatMinutesToTime(usage.value.remainingMinutes)} 남음`
  })

  // 사용한 시간 (분 초 형식)
  const usedTimeText = computed(() => {
    return formatMinutesToTime(usage.value.totalMinutes)
  })

  // 남은 시간 (분 초 형식)
  const remainingTimeText = computed(() => {
    return formatMinutesToTime(usage.value.remainingMinutes)
  })

  return {
    usage,
    isLoading,
    error,
    usagePercentage,
    statusColor,
    statusText,
    usedTimeText,
    remainingTimeText,
    fetchUsage
  }
}

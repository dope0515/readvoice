import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient
  
  const config = useRuntimeConfig()
  
  // 환경 변수가 없으면 null 반환 (에러 던지지 않음)
  if (!config.supabase.url || !config.supabase.key) {
    console.warn('Supabase credentials not configured. Usage tracking will use default values.')
    return null
  }
  
  try {
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.key
    )
    return supabaseClient
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

interface UsageTracking {
  id: string
  total_minutes: number
  limit_minutes: number
  max_minutes: number
  is_locked: boolean
  updated_at: string
}

const USAGE_ID = '00000000-0000-0000-0000-000000000001'

/**
 * 현재 사용량 조회
 */
export async function getCurrentUsage(): Promise<UsageTracking> {
  const supabase = getSupabaseClient()
  
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('id', USAGE_ID)
    .single()
  
  if (error) {
    console.error('Failed to get current usage:', error)
    throw createError({
      statusCode: 500,
      message: '사용량 조회에 실패했습니다.'
    })
  }
  
  return data as UsageTracking
}

/**
 * 사용량 추가
 */
export async function addUsage(minutes: number, source: string) {
  const supabase = getSupabaseClient()
  
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  try {
    // 1. 현재 사용량 조회
    const current = await getCurrentUsage()
    
    // 2. 새로운 사용량 계산
    const newTotal = Number(current.total_minutes) + Number(minutes)
    const isLocked = newTotal >= Number(current.limit_minutes)
    
    // 3. 사용량 업데이트
    const { error: updateError } = await supabase
      .from('usage_tracking')
      .update({
        total_minutes: newTotal,
        is_locked: isLocked,
        updated_at: new Date().toISOString()
      })
      .eq('id', USAGE_ID)
    
    if (updateError) {
      console.error('Failed to update usage:', updateError)
      throw createError({
        statusCode: 500,
        message: '사용량 업데이트에 실패했습니다.'
      })
    }
    
    // 4. 로그 기록
    const { error: logError } = await supabase
      .from('usage_logs')
      .insert({
        duration_minutes: minutes,
        source
      })
    
    if (logError) {
      console.error('Failed to log usage:', logError)
      // 로그 실패는 치명적이지 않으므로 계속 진행
    }
    
    return {
      newTotal,
      isLocked,
      remainingMinutes: Math.max(0, Number(current.limit_minutes) - newTotal)
    }
  } catch (error) {
    console.error('Error in addUsage:', error)
    throw error
  }
}

/**
 * 사용 가능 여부 체크
 */
export async function checkUsageLimit() {
  try {
    const usage = await getCurrentUsage()
    
    const totalMinutes = Number(usage.total_minutes)
    const limitMinutes = Number(usage.limit_minutes)
    const maxMinutes = Number(usage.max_minutes)
    
    return {
      isAvailable: !usage.is_locked && totalMinutes < limitMinutes,
      totalMinutes,
      remainingMinutes: Math.max(0, limitMinutes - totalMinutes),
      limitMinutes,
      maxMinutes,
      isLocked: usage.is_locked
    }
  } catch (error) {
    console.error('Error in checkUsageLimit:', error)
    throw error
  }
}

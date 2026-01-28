export default defineEventHandler(async () => {
  try {
    // Supabase 클라이언트 확인
    const client = getSupabaseClient()
    if (!client) {
      // Supabase 미설정 시 기본값 반환
      console.warn('Supabase not configured, returning default usage values')
      return {
        success: true,
        isAvailable: true,
        totalMinutes: 0,
        remainingMinutes: 530,
        limitMinutes: 530,
        maxMinutes: 600,
        isLocked: false
      }
    }
    
    const usage = await checkUsageLimit()
    
    return {
      success: true,
      ...usage
    }
  } catch (error: any) {
    console.error('Usage API error:', error)
    
    // 에러 발생 시에도 기본값 반환 (500 에러 대신)
    // 이렇게 하면 앱이 크래시하지 않고 계속 작동함
    return {
      success: false,
      isAvailable: true,
      totalMinutes: 0,
      remainingMinutes: 530,
      limitMinutes: 530,
      maxMinutes: 600,
      isLocked: false
    }
  }
})

<template>
  <div class="app-layout">
    <!-- 헤더 -->
    <header class="app-header">
      <div class="app-header__container">
        <div class="app-header__content">
          <div class="app-header__brand">
            <svg class="app-header__logo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
            <h1 class="app-header__title">읽어줄래요</h1>
            <p class="app-header__subtitle">(마음만은 고품격 음성-텍스트 변환 서비스)</p>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <main class="app-main">
      <div class="app-main__card">
        <!-- 탭 네비게이션 -->
        <div class="app-main__tabs">
          <TabNavigation 
            :active-tab="activeTab" 
            @change-tab="changeTab" 
          />
        </div>

        <!-- 컨텐츠 영역 -->
        <div class="app-main__content">
          <transition
            mode="out-in"
            enter-active-class="fade-enter-active"
            enter-from-class="fade-enter-from"
            leave-active-class="fade-leave-active"
            leave-to-class="fade-leave-to"
          >
            <FileUploadSTT v-if="activeTab === 'file'" />
            <RealtimeSTT v-else-if="activeTab === 'realtime'" />
          </transition>
        </div>
      </div>

    </main>

    <!-- 푸터 (라이선스 고지) -->
    <LicenseFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('file')

const changeTab = (tabId: string) => {
  activeTab.value = tabId
}
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &__container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;

    @media (min-width: 640px) {
      padding: 1.5rem 1.5rem;
    }

    @media (min-width: 1024px) {
      padding: 1.5rem 2rem;
    }
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__logo {
    height: 2rem;
    width: 2rem;
    color: #2563eb;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  &__subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
}

.app-main {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  flex-grow: 1;
  width: 100%;

  @media (min-width: 640px) {
    padding: 2rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem 2rem;
  }

  &__card {
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 2rem 1.5rem;
  }

}

/* Transition classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <div class="app-layout">
    <!-- Google-style 헤더 -->
    <header class="app-header">
      <div class="app-header__container">
        <div class="app-header__brand">
          <!-- Multi-color Google-style mic icon -->
          <svg class="app-header__logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="#ffffff"/>
            <rect x="15" y="8" width="10" height="16" rx="5" fill="#4285F4"/>
            <path d="M10 20c0 5.523 4.477 10 10 10s10-4.477 10-10" stroke="#EA4335" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <line x1="20" y1="30" x2="20" y2="35" stroke="#34A853" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="15" y1="35" x2="25" y2="35" stroke="#FBBC04" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <span class="app-header__title">
            읽어줄래요
          </span>
        </div>
        <div class="app-header__right">
          <span class="app-header__badge">Beta</span>
        </div>
      </div>
    </header>

    <!-- 메인 -->
    <main class="app-main">
      <div class="app-main__card">
        <div class="app-main__tabs">
          <TabNavigation :active-tab="activeTab" @change-tab="changeTab" />
        </div>
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

    <LicenseFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('file')
const changeTab = (tabId: string) => { activeTab.value = tabId }
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* ── Google-style Header ── */
.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e8eaed;
  position: sticky;
  top: 0;
  z-index: 100;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__logo {
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 1px 3px rgba(0,0,0,0.12));
  }

  &__title {
    font-size: 22px;
    font-weight: 400;
    letter-spacing: -0.3px;
    
    // Google multi-color letters
    &-g  { color: #4285F4; }
    &-o  { color: #EA4335; }
    &-o2 { color: #FBBC04; }
    &-g2 { color: #4285F4; }
    &-r  { color: #34A853; }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__badge {
    font-size: 11px;
    font-weight: 500;
    color: #1a73e8;
    background-color: #e8f0fe;
    padding: 3px 8px;
    border-radius: 12px;
    letter-spacing: 0.3px;
  }
}

/* ── Main Content ── */
.app-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
  flex-grow: 1;
  width: 100%;

  @media (min-width: 640px) { padding: 32px 24px; }
  @media (min-width: 1024px) { padding: 40px 24px; }

  &__card {
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e8eaed;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
    padding: 32px 28px;
  }
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

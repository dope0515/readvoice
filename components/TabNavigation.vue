<template>
  <div class="tab-navigation">
    <nav class="tab-list" role="tablist" aria-label="기능 선택 탭">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('change-tab', tab.id)"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`tabpanel-${tab.id}`"
        :id="`tab-${tab.id}`"
        :class="['tab-button', { 'tab-button--active': activeTab === tab.id }]"
      >
        <svg v-if="tab.id === 'file'" class="tab-button__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
        <svg v-else class="tab-button__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>
        {{ tab.name }}
        <span v-if="activeTab === tab.id" class="tab-button__indicator"></span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
interface Tab { id: string; name: string }

defineProps<{ activeTab: string }>()
defineEmits<{ 'change-tab': [tabId: string] }>()

const tabs: Tab[] = [
  { id: 'file', name: '파일 업로드' },
  { id: 'realtime', name: '녹음 인식' }
]
</script>

<style lang="scss" scoped>
.tab-navigation {
  border-bottom: 1px solid #e8eaed;
  margin-bottom: 28px;
}

.tab-list {
  display: flex;
  gap: 0;
}

.tab-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.25px;
  color: #5f6368;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.15s ease;
  border-radius: 4px 4px 0 0;
  white-space: nowrap;
  outline: none;
  @media screen and (max-width: 768px) {
    width: 50%;
    justify-content: center;
  }
  &__icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  &__indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background-color: #1a73e8;
    border-radius: 3px 3px 0 0;
  }

  &:hover {
    color: #1a73e8;
    background-color: #f1f3f4;
  }

  &--active {
    color: #1a73e8;
    font-weight: 600;

    &:hover {
      background-color: #e8f0fe;
    }
  }
}
</style>

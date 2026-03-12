<template>
  <div class="tab-navigation">
    <nav class="tab-list" aria-label="Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('change-tab', tab.id)"
        :class="['tab-button', { 'tab-button--active': activeTab === tab.id }]"
      >
        {{ tab.name }}
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  id: string
  name: string
}

defineProps<{
  activeTab: string
}>()

defineEmits<{
  'change-tab': [tabId: string]
}>()

const tabs: Tab[] = [
  { id: 'file', name: '파일 업로드' },
  { id: 'realtime', name: '실시간 음성 인식' }
]
</script>

<style lang="scss" scoped>
.tab-navigation {

  .tab-list {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .tab-button {
    white-space: nowrap;
    padding: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    color: #6b7280;
    transition: color 0.2s ease, border-color 0.2s ease;
    border-radius: 0.5rem;
    background: transparent;
    cursor: pointer;

    &:hover {
      color: #374151;
    }

    &--active {
      border-color: #3b82f6;
      color: #2563eb;

      &:hover {
        color: #2563eb;
      }
    }
  }
}
</style>

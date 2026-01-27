<template>
  <div class="border-b border-gray-200">
    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('change-tab', tab.id)"
        :class="[
          activeTab === tab.id
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200'
        ]"
      >
        {{ tab.name }}
      </button>
    </nav>
  </div>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

defineEmits(['change-tab'])

const tabs = [
  { id: 'file', name: '파일 업로드' },
  { id: 'realtime', name: '실시간 음성 인식' }
]
</script>

<template>
  <footer class="bg-white border-t border-gray-200 mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <!-- 저작권 정보 -->
        <div class="text-sm text-gray-600">
          <p>&copy; 2026 읽어줄래요. All rights reserved.</p>
        </div>

        <!-- 오픈소스 고지 -->
        <div class="flex items-center space-x-4">
          <button
            @click="showLicenseModal = true"
            class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            오픈소스 라이선스
          </button>
          <a
            href="https://github.com/openai/whisper"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Powered by Whisper
          </a>
        </div>
      </div>
    </div>

    <!-- 라이선스 모달 -->
    <Teleport to="body">
      <div
        v-if="showLicenseModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="showLicenseModal = false"
      >
        <div class="flex items-center justify-center min-h-screen px-4">
          <!-- 배경 오버레이 -->
          <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

          <!-- 모달 컨텐츠 -->
          <div
            class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            @click.stop
          >
            <!-- 헤더 -->
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold text-gray-900">
                  오픈소스 라이선스
                </h3>
                <button
                  @click="showLicenseModal = false"
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 컨텐츠 -->
            <div class="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <p class="text-sm text-gray-600 mb-6">
                이 서비스는 다음 오픈소스 소프트웨어를 사용하며, 모두 MIT 라이선스를 따릅니다.
              </p>

              <!-- 각 라이선스 -->
              <div class="space-y-6">
                <div v-for="license in licenses" :key="license.name" class="border-l-4 border-blue-500 pl-4">
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">
                    {{ license.name }}
                  </h4>
                  <p class="text-sm text-gray-600 mb-2">{{ license.description }}</p>
                  <a
                    :href="license.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {{ license.url }}
                  </a>
                  <p class="text-xs text-gray-500 mt-2">
                    MIT License - {{ license.copyright }}
                  </p>
                </div>
              </div>

              <!-- MIT 라이선스 전문 -->
              <div class="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-900 mb-2">MIT License</h4>
                <pre class="text-xs text-gray-600 whitespace-pre-wrap font-mono">{{ mitLicenseText }}</pre>
              </div>
            </div>

            <!-- 푸터 -->
            <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                @click="showLicenseModal = false"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showLicenseModal = ref(false)

const licenses = [
  {
    name: 'OpenAI Whisper',
    description: '음성 인식 AI 모델',
    url: 'https://github.com/openai/whisper',
    copyright: 'Copyright (c) 2022 OpenAI'
  },
  {
    name: 'Nuxt.js',
    description: 'Vue.js 프레임워크',
    url: 'https://github.com/nuxt/nuxt',
    copyright: 'Copyright (c) 2016-present Nuxt'
  },
  {
    name: 'Vue.js',
    description: 'JavaScript 프레임워크',
    url: 'https://github.com/vuejs/core',
    copyright: 'Copyright (c) 2013-present Evan You'
  },
  {
    name: 'FastAPI',
    description: 'Python 웹 프레임워크',
    url: 'https://github.com/tiangolo/fastapi',
    copyright: 'Copyright (c) 2018 Sebastián Ramírez'
  },
  {
    name: 'Ollama',
    description: '로컬 LLM 실행 도구',
    url: 'https://github.com/ollama/ollama',
    copyright: 'Copyright (c) 2023 Jeffrey Morgan'
  },
  {
    name: 'TailwindCSS',
    description: 'CSS 프레임워크',
    url: 'https://github.com/tailwindlabs/tailwindcss',
    copyright: 'Copyright (c) Tailwind Labs, Inc.'
  }
]

const mitLicenseText = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
</script>

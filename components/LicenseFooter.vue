<template>
  <footer class="app-footer">
    <div class="app-footer__container">
      <div class="app-footer__content">
        <div class="app-footer__copyright">
          <p>&copy; 2026 읽어줄래요. All rights reserved.</p>
        </div>

        <div class="app-footer__links">
          <button @click="showLicenseModal = true" class="app-footer__btn">
            오픈소스 라이선스
          </button>
          <a
            href="https://github.com/openai/whisper"
            target="_blank"
            rel="noopener noreferrer"
            class="app-footer__link"
          >
            Powered by Whisper
          </a>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showLicenseModal" class="license-modal" @click="showLicenseModal = false">
        <div class="license-modal__wrapper">
          <div class="license-modal__overlay"></div>

          <div class="license-modal__content" @click.stop>
            <div class="license-modal__header">
              <h3 class="license-modal__title">오픈소스 라이선스</h3>
              <button @click="showLicenseModal = false" class="license-modal__close">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="license-modal__body">
              <p class="license-modal__description">
                이 서비스는 다음 오픈소스 소프트웨어를 사용하며, 모두 MIT 라이선스를 따릅니다.
              </p>

              <div class="license-list">
                <div v-for="license in licenses" :key="license.name" class="license-item">
                  <h4 class="license-item__name">{{ license.name }}</h4>
                  <p class="license-item__desc">{{ license.description }}</p>
                  <a :href="license.url" target="_blank" rel="noopener noreferrer" class="license-item__url">
                    {{ license.url }}
                  </a>
                  <p class="license-item__copyright">MIT License - {{ license.copyright }}</p>
                </div>
              </div>

              <div class="mit-license">
                <h4 class="mit-license__title">MIT License</h4>
                <pre class="mit-license__text">{{ mitLicenseText }}</pre>
              </div>
            </div>

            <div class="license-modal__footer">
              <button @click="showLicenseModal = false" class="license-modal__action">닫기</button>
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

<style lang="scss" scoped>
.app-footer {
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  margin-top: 3rem;

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
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    @media (min-width: 768px) {
      flex-direction: row;
      gap: 0;
    }
  }

  &__copyright {
    font-size: 0.875rem;
    color: #4b5563;
  }

  &__links {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__btn {
    font-size: 0.875rem;
    color: #2563eb;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: #1e40af;
    }
  }

  &__link {
    font-size: 0.875rem;
    color: #4b5563;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #1f2937;
    }
  }
}

.license-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;

  &__wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 0 1rem;
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
  }

  &__content {
    position: relative;
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 56rem;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: #4b5563;
    }
  }

  &__body {
    padding: 1rem 1.5rem;
    overflow-y: auto;
    max-height: 60vh;
  }

  &__description {
    font-size: 0.875rem;
    color: #4b5563;
    margin-bottom: 1.5rem;
  }

  &__footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }

  &__action {
    width: 100%;
    padding: 0.5rem 1rem;
    background-color: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #1d4ed8;
    }
  }
}

.license-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.license-item {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;

  &__name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem;
  }

  &__desc {
    font-size: 0.875rem;
    color: #4b5563;
    margin: 0 0 0.5rem;
  }

  &__url {
    font-size: 0.875rem;
    color: #2563eb;
    text-decoration: none;

    &:hover {
      color: #1e40af;
    }
  }

  &__copyright {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0.5rem 0 0;
  }
}

.mit-license {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;

  &__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem;
  }

  &__text {
    font-size: 0.75rem;
    color: #4b5563;
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    margin: 0;
  }
}
</style>

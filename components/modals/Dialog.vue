<script setup lang="ts">
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg?component'
import SVGErrorCircle from '~/assets/images/icons/error-circle.svg?component'
import SVGQuestionCircle from '~/assets/images/icons/question-circle.svg?component'

defineProps<{
  id?: string
  title: string
  content: string
  type: 'success' | 'error' | 'question'
  headerIconUrl?: string
  headerIconComponent?: any
  isButtonVisible?: boolean
  isCancelButtonVisible?: boolean
  buttonText?: string
  cancelButtonText?: string
  cancelButtonProps?: any
  buttonProps?: any
}>()

const emit = defineEmits(['resolve', 'reject'])

function handleResolve() {
  return emit('resolve', true)
}

function handleReject() {
  return emit('reject', false)
}
</script>

<template>
  <div
    class="inline-flex w-full flex-col gap-5"
  >
    <ModalTitle :class="!content ? 'items-center' : ''">
      <template #icon-content>
        <component :is="headerIconComponent" v-if="headerIconComponent" class="shrink-0" />
        <img
          v-else-if="headerIconUrl"
          class="h-10 w-10 shrink-0"
          width="40"
          height="40"
          :src="headerIconUrl"
        >
        <SVGCheckCircle
          v-else-if="type === 'success'"
          class="success-circle text-white"
        />
        <SVGErrorCircle v-else-if="type === 'error'" class="h-10 w-10 shrink-0 fill-primary text-white" />
        <SVGQuestionCircle v-else-if="type === 'question'" class="h-10 w-10 shrink-0 text-primary" />
      </template>
      <template #title>
        {{ title }}
      </template>
      <template #subtitle>
        <div v-if="content" v-html="content" />
      </template>
    </ModalTitle>

    <div
      v-if="isCancelButtonVisible || isButtonVisible"
      class="flex w-full items-center gap-4"
    >
      <CommonButton
        v-if="isCancelButtonVisible"
        class="flex-1 justify-center"
        v-bind="cancelButtonProps"
        size="lg"
        @click="handleReject()"
      >
        {{ cancelButtonText }}
      </CommonButton>
      <CommonButton
        v-if="isButtonVisible"
        class="flex-1 justify-center"
        v-bind="buttonProps"
        size="lg"
        @click="handleResolve()"
      >
        {{ buttonText }}
      </CommonButton>
    </div>
  </div>
</template>

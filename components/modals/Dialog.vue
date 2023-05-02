<script setup lang="ts">
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg'
import SVGErrorCircle from '~/assets/images/icons/error-circle.svg'
import SVGQuestionCircle from '~/assets/images/icons/question-circle.svg'

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
    class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
  >
    <component :is="headerIconComponent" v-if="headerIconComponent" />
    <img
      v-else-if="headerIconUrl"
      class="w-10 h-10"
      width="40"
      height="40"
      :src="headerIconUrl"
    >
    <SVGCheckCircle
      v-else-if="type === 'success'"
      class="text-white success-circle"
    />
    <SVGErrorCircle v-else-if="type === 'error'" class="text-white w-10 h-10 fill-primary" />
    <SVGQuestionCircle v-else-if="type === 'question'" class="w-10 h-10 text-primary" />

    <div class="flex flex-col gap-[15px]">
      <h1 v-if="title" class="text-lg font-semibold">
        {{ title }}
      </h1>
      <p
        v-if="content"
        class="text-slate-400 text-xs text-center leading-5 font-medium"
        v-html="content"
      />
    </div>
    <div
      v-if="isCancelButtonVisible || isButtonVisible"
      class="flex w-full gap-4 items-center"
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

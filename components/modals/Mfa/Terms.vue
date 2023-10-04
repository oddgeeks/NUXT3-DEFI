<script setup lang="ts">
const emit = defineEmits(['resolve'])

const { mfaTermsAccepted } = useMfa()

const checked = ref<boolean[]>([])
const terms = [
  'The illumination of the sky, at first glance, is looking for materialistic autotraining.',
  'The subconscious is a complex of the most unconscious, even if the tendency to conformism is characteristic',
  'The archetype, as is commonly believed, is a complex of the most unconscious',
]

function handleProceed() {
  mfaTermsAccepted.value = true
  emit('resolve', true)
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <div class="flex items-center gap-[14px]">
      <SvgoExclamationCircle class="h-10 w-10 text-orange-400" />
      <h1 class="text-lg">
        Important information
      </h1>
    </div>
    <ul class="flex flex-col gap-5">
      <li v-for="term, i in terms" :key="term" class="text-xs font-medium leading-5 text-slate-400">
        <label class="flex cursor-pointer gap-2.5" :for="`input-${i}`">
          <input :id="`input-${i}`" v-model="checked" :value="i" class="peer sr-only" type="checkbox">
          <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle mt-1 h-5 w-5 shrink-0 cursor-pointer text-slate-500" />
          {{ term }}
        </label>
      </li>
    </ul>
    <CommonButton class="justify-center text-center" :disabled="checked.length !== terms.length" size="lg" @click="handleProceed">
      Proceed
    </CommonButton>
  </div>
</template>

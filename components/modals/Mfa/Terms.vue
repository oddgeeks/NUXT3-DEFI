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
      <SvgoExclamationCircle class="text-orange-400 w-10 h-10" />
      <h1 class="text-lg">
        Important information
      </h1>
    </div>
    <ul class="flex gap-5 flex-col">
      <li v-for="term, i in terms" :key="term" class="text-xs font-medium leading-5 text-slate-400">
        <label class="flex gap-2.5 cursor-pointer" :for="`input-${i}`">
          <input :id="`input-${i}`" v-model="checked" :value="i" class="peer sr-only" type="checkbox">
          <SvgoCheckCircle class="shrink-0 mt-1 w-5 h-5 svg-circle cursor-pointer darker text-slate-500 peer-checked:success-circle" />
          {{ term }}
        </label>
      </li>
    </ul>
    <CommonButton class="text-center justify-center" :disabled="checked.length !== terms.length" size="lg" @click="handleProceed">
      Proceed
    </CommonButton>
  </div>
</template>

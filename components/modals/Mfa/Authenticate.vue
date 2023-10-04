<script setup lang="ts">
const emit = defineEmits(['resolve'])
const { mfaTypes, preferredMfaType } = useMfa()
const enabledMfas = computed(() => mfaTypes.value.filter(i => i.activated))

const mfaType = ref(preferredMfaType.value)

async function handleTypeSelection() {
  const mfaObj = mfaTypes.value.find(i => i.value === mfaType.value)

  if (!mfaObj)
    return

  emit('resolve', true, {
    mfa: mfaObj,
  })
}
</script>

<template>
  <div class="p-7.5">
    <div class="flex gap-[14px] mb-7.5">
      <CommonTxTypeIcon class="w-10 h-10">
        <template #icon>
          <SvgoSecurity />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-[20px]">
          How do you want to Authenticate?
        </h1>
        <h2 class="font-medium text-xs text-slate-400 leading-5">
          You can set up multiple modes of verification and later use any method to confirm your identity.
        </h2>
      </div>
    </div>
    <ul class="flex flex-col gap-5">
      <li v-for="mfa in enabledMfas" :key="mfa.value">
        <button
          :class="[
            mfa.value === mfaType ? 'dark:bg-slate-800' : 'bg-slate-50 dark:bg-gray-850',
          ]"
          class=" flex items-center justify-between text-sm p-5 w-full text-left dark:border-slate-700 text-slate-400 font-medium border  rounded-2xl"
          @click="mfaType = mfa.value"
        >
          {{ mfa.label }}
          <div :class="mfa.value === mfaType ? 'bg-primary' : 'dark:bg-slate-600'" class="w-5 h-5 rounded-full flex items-center  justify-center">
            <div :class="mfa.value === mfaType ? 'bg-white' : 'dark:bg-slate-500'" class="w-1.5 h-1.5 rounded-full" />
          </div>
        </button>
      </li>
    </ul>
    <CommonButton
      :disabled="!mfaType" size="lg" class="w-full justify-center mt-5" @click="handleTypeSelection"
    >
      Confirm Changes
    </CommonButton>
  </div>
</template>

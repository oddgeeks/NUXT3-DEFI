<script setup lang="ts">
const props = defineProps<{
  mfaRequestType: MfaRequestType
}>()

const emit = defineEmits(['resolve'])
const { mfaTypes, preferredMfaType } = useMfa()
const enabledMfas = computed(() => mfaTypes.value.filter(i => i.activated))

const mfaType = ref(preferredMfaType.value)

const sessionAvailable = ref(false)

async function handleTypeSelection() {
  const mfaObj = mfaTypes.value.find(i => i.value === mfaType.value)

  if (!mfaObj)
    return

  emit('resolve', true, {
    mfa: mfaObj,
    sessionAvailable: sessionAvailable.value,
  })
}
</script>

<template>
  <div class="p-7.5">
    <div class="mb-7.5 flex gap-[14px]">
      <CommonTxTypeIcon class="h-10 w-10">
        <template #icon>
          <SvgoSecurity />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-[20px]">
          How do you want to Authenticate?
        </h1>
        <h2 class="text-xs font-medium leading-5 text-slate-400">
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
          class=" flex w-full items-center justify-between rounded-2xl border p-5 text-left text-sm font-medium text-slate-400  dark:border-slate-700"
          @click="mfaType = mfa.value"
        >
          {{ mfa.label }}
          <div :class="mfa.value === mfaType ? 'bg-primary' : 'dark:bg-slate-600'" class="flex h-5 w-5 items-center justify-center  rounded-full">
            <div :class="mfa.value === mfaType ? 'bg-white' : 'dark:bg-slate-500'" class="h-1.5 w-1.5 rounded-full" />
          </div>
        </button>
      </li>
    </ul>

    <label v-if="props.mfaRequestType === 'transaction'" class="mt-7.5 flex cursor-pointer items-center gap-2.5 text-xs text-slate-400" for="input-session">
      <input id="input-session" v-model="sessionAvailable" class="peer sr-only" type="checkbox">
      <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle mt-1 h-5 w-5 shrink-0 cursor-pointer text-slate-500" />
      Don’t ask for OTP verification for the next 30 min.
    </label>
    <CommonButton
      :disabled="!mfaType" size="lg" class="mt-5 w-full justify-center" @click="handleTypeSelection"
    >
      Confirm Changes
    </CommonButton>
  </div>
</template>

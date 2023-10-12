<script setup lang="ts">
defineProps<{
  mfaRequestType: MfaRequestType
}>()

defineEmits(['resolve'])
const { mfaTypes, preferredMfaType } = useMfa()
const enabledMfas = computed(() => mfaTypes.value.filter(i => i.activated))

const mfaType = ref(preferredMfaType.value)
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
          class="flex w-full items-center justify-between rounded-2xl border bg-slate-50 p-5 text-left text-sm font-medium text-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-gray-850  hover:dark:bg-gray-800"
          @click="$emit('resolve', true, {
            mfa,
          })"
        >
          <span class="flex items-center gap-[14px]">
            <Component :is="mfa.icon" class="text-slate-400" />
            {{ mfa.label }}
          </span>
          <SvgoChevronDown class="-rotate-90" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  mfaRequestType: MfaRequestType
  excludeMfa: IMfa
  chainId?: number | string
}>()

defineEmits(['resolve'])
const { mfaTypes, backupSigner } = useMfa()
const enabledMfas = computed(() => mfaTypes.value.filter(i => i.activated && i.value !== props.excludeMfa.value))

const isBackupSignerAvailable = computed(() => {
  if (!props.chainId)
    return false

  return backupSigner.value.chainIds.some(i => String(i) === String(props.chainId))
})
</script>

<template>
  <div class="p-7.5">
    <div class="mb-7.5 flex items-center gap-[14px]">
      <CommonTxTypeIcon class="h-10 w-10">
        <template #icon>
          <SvgoSecurity />
        </template>
      </CommonTxTypeIcon>
      <h1 class="text-lg leading-[20px]">
        How else do you want to authenticate?
      </h1>
    </div>
    <ul class="flex flex-col gap-5">
      <template v-for="mfa in enabledMfas" :key="mfa.value">
        <li v-if="mfa.value !== 'backup'">
          <button
            class="flex w-full items-center justify-between rounded-2xl border bg-slate-50 p-5 text-left text-sm font-medium text-gray-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-gray-850  hover:dark:bg-gray-800"
            @click="$emit('resolve', true, {
              mfa,
            })"
          >
            <span class="flex items-center gap-[14px]">
              <Component :is="mfa.icon" class="text-gray-400" />
              {{ mfa.label }}
            </span>
            <SvgoChevronDown class="-rotate-90" />
          </button>
        </li>
        <li v-else-if="isBackupSignerAvailable" class="text-xs font-medium text-gray-400">
          OTP inaccessable? <button class="text-primary" @click="$emit('resolve', true, { mfa })">
            Use backup address to approve transaction
          </button>
        </li>
      </template>
    </ul>
  </div>
</template>

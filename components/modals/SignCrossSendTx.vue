<script setup lang="ts">
const props = defineProps<{
  targetMessage: any
  sourceMessage: any
  targetChainId: number
  sourceChainId: number
}>()
const emit = defineEmits(['resolve'])
const { account } = useWeb3()
const signatures = ref({
  source: '',
  target: '',
})

const loading = ref({
  source: false,
  target: false,
})

const { safe } = useAvocadoSafe()

async function handleSign(source: boolean) {
  const message = source ? props.sourceMessage : props.targetMessage
  const chainId = source ? props.sourceChainId : props.targetChainId

  try {
    loading.value[source ? 'source' : 'target'] = true

    // @ts-expect-error
    const signature = await safe.value?.buildSignature(message, chainId)

    if (source)
      signatures.value.source = signature

    else
      signatures.value.target = signature
  }
  catch (e) {
    console.log(e)
  }
  finally {
    loading.value[source ? 'source' : 'target'] = false
  }
}

watch(signatures, () => {
  if (signatures.value.source && signatures.value.target) {
    emit('resolve', true, [
      {
        signature: signatures.value.source,
        message: props.sourceMessage,
        owner: account.value,
        chainId: props.sourceChainId,
      },
      {
        signature: signatures.value.target,
        message: props.targetMessage,
        owner: account.value,
        chainId: props.targetChainId,
      },
    ])
  }
}, {
  immediate: true,
  deep: true,
})
</script>

<template>
  <div>
    <h1 class="text-center mb-3">
      Sign Transaction
    </h1>
    <h2 class="text-xs leading-5 text-slate-400 text-center mb-7.5">
      Cross chain send transactions require <br>
      2 signatures
    </h2>
    <div class="grid grid-cols-2 gap-5">
      <div class="dark:bg-gray-850 rounded-5 p-4 flex flex-col items-center gap-5">
        <h1 class="text-xs text-slate-400">
          Source Approval
        </h1>
        <div class="flex flex-col gap-2.5">
          <ChainLogo class="w-[60px] h-[60px]" :chain="sourceChainId" />
          <span class="text-sm"> {{ chainIdToName(sourceChainId) }}</span>
        </div>
        <CommonButton :disabled="!!signatures.source || loading.source" :loading="loading.source" class="py-2 w-full justify-center" size="sm" @click="handleSign(true)">
          {{ !!signatures.source ? 'Confirmed' : 'Confirm Now' }}
        </CommonButton>
      </div>
      <div class="dark:bg-gray-850 rounded-5 p-4 flex flex-col items-center gap-5">
        <h1 class="text-xs text-slate-400">
          Source Approval
        </h1>
        <div class="flex flex-col gap-2.5">
          <ChainLogo class="w-[60px] h-[60px]" :chain="targetChainId" />
          <span class="text-sm"> {{ chainIdToName(targetChainId) }}</span>
        </div>
        <CommonButton :disabled="!!signatures.target || loading.target" :loading="loading.target" class="py-2 w-full justify-center" size="sm" @click="handleSign(false)">
          {{ !!signatures.target ? 'Confirmed' : 'Confirm Now' }}
        </CommonButton>
      </div>
    </div>
  </div>
</template>

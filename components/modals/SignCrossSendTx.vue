<script setup lang="ts">
const props = defineProps<{
  targetMessage: any
  sourceMessage: any
  targetChainId: number
  sourceChainId: number
}>()

const emit = defineEmits(['resolve'])

interface SignatureType {
  source: string | null
  target: string | null
}

const { account } = useWeb3()
const { isSelectedSafeLegacy } = storeToRefs(useSafe())
const signatures = ref<SignatureType>({
  source: null,
  target: null,
})

const loading = ref({
  source: false,
  target: false,
})

const { signLegacyData, signMultisigData } = useAvocadoSafe()
const { switchToAvocadoNetwork } = useNetworks()

async function handleSign(source: boolean) {
  await switchToAvocadoNetwork()

  const message = source ? props.sourceMessage : props.targetMessage
  const chainId = source ? props.sourceChainId : props.targetChainId

  try {
    loading.value[source ? 'source' : 'target'] = true

    let signature

    if (isSelectedSafeLegacy.value) {
      const { signature: legacySignature } = await signLegacyData({ chainId, message })
      signature = legacySignature
    }
    else {
      signature = await signMultisigData({ chainId, data: message })
    }

    if (!signature)
      return

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
    emit('resolve', true, {
      source: {
        signature: signatures.value.source,
        owner: account.value,
        chainId: String(props.sourceChainId),
      },
      target: {
        signature: signatures.value.target,
        owner: account.value,
        chainId: String(props.targetChainId),
      },
    })

    emit('resolve', true, signatures.value)
  }
}, {
  immediate: true,
  deep: true,
})
</script>

<template>
  <div>
    <h1 class="mb-3 text-center">
      Sign Transaction
    </h1>
    <h2 class="mb-7.5 text-center text-xs leading-5 text-slate-400">
      Cross chain send transactions require <br>
      2 signatures
    </h2>
    <div class="grid grid-cols-2 gap-5">
      <div class="flex flex-col items-center gap-5 rounded-5 p-4 dark:bg-gray-850">
        <h1 class="text-xs text-slate-400">
          Source Approval
        </h1>
        <div class="flex flex-col items-center gap-2.5">
          <ChainLogo class="h-[60px] w-[60px]" :chain="sourceChainId" />
          <span class="text-sm"> {{ chainIdToName(sourceChainId) }}</span>
        </div>
        <CommonButton :disabled="!!signatures.source || loading.source" :loading="loading.source" class="w-full justify-center py-2" size="sm" @click="handleSign(true)">
          {{ !!signatures.source ? 'Confirmed' : 'Confirm Now' }}
        </CommonButton>
      </div>
      <div class="flex flex-col items-center gap-5 rounded-5 p-4 dark:bg-gray-850">
        <h1 class="text-xs text-slate-400">
          Dest. Approval
        </h1>
        <div class="flex flex-col items-center gap-2.5">
          <ChainLogo class="h-[60px] w-[60px]" :chain="targetChainId" />
          <span class="text-sm"> {{ chainIdToName(targetChainId) }}</span>
        </div>
        <CommonButton :disabled="!!signatures.target || loading.target" :loading="loading.target" class="w-full justify-center py-2" size="sm" @click="handleSign(false)">
          {{ !!signatures.target ? 'Confirmed' : 'Confirm Now' }}
        </CommonButton>
      </div>
    </div>
  </div>
</template>

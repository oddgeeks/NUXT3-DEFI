<script lang="ts" setup>
const props = defineProps<{
  address: string
  chainId: string | number
}>()

defineEmits(['destroy'])

const pending = ref(false)
const signed = ref(false)

const { removeSignerWithThreshold } = useAvocadoSafe()

async function handleSign() {
  try {
    pending.value = true

    const { payload: threshold, success } = await openUpdateThresholdModal(props.chainId, -1)

    if (!success)
      return

    await removeSignerWithThreshold({
      addresses: [props.address],
      chainId: props.chainId,
      threshold,
    })
    signed.value = true
  }
  catch (e) {
    console.error(e)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex w-full items-center justify-between">
    <span class="flex items-center gap-3 text-sm leading-5">
      <ChainLogo class="h-[26px] w-[26px]" :chain="chainId" />
      {{ chainIdToName(chainId) }}
    </span>
    <CommonButton :disabled="pending || signed" :loading="pending" @click="handleSign">
      {{ signed ? 'Signed' : 'Sign' }}
    </CommonButton>
  </div>
</template>

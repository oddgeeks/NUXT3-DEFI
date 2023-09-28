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
  <div class="flex items-center justify-between w-full">
    <span class="flex items-center gap-3 text-sm leading-5">
      <ChainLogo class="w-[26px] h-[26px]" :chain="chainId" />
      {{ chainIdToName(chainId) }}
    </span>
    <CommonButton :disabled="pending || signed" :loading="pending" @click="handleSign">
      {{ signed ? 'Signed' : 'Sign' }}
    </CommonButton>
  </div>
</template>

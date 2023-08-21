<script lang="ts" setup>
import type { IBalance } from 'stores/safe'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'
import type { IToken } from '~~/stores/tokens'

const props = withDefaults(
  defineProps<{
    tokens: IToken[] | IBalance[] | any
    modelValue: IToken | any
    chainId?: string | number
    networkLogoClass?: string
    sort?: boolean
    pending?: boolean | undefined
  }>(),
  {
    sort: true,
  },
)

const emit = defineEmits(['resolve', 'reject', 'update:modelValue'])

const tokens = toRef(props, 'tokens')

const selectedToken = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  },
})

async function handleTokenSelection() {
  const result = await openTokenSelectionModal({
    tokens,
    selectedToken: selectedToken.value,
    sort: props.sort,
  })

  if (result.success)
    selectedToken.value = result.payload as IToken
}
</script>

<template>
  <button
    type="button"
    :disabled="pending"
    class="dark:bg-gray-900 bg-white text-sm uppercase h-fit inline-flex gap-2.5 items-center rounded-2xl pl-[14px] pr-3 py-3"
    @click="handleTokenSelection"
  >
    <div v-if="pending" class="loading-box rounded-lg w-20 h-5 my-1" />
    <template v-else>
      <SafeTokenLogo :network-logo-class="networkLogoClass" :chain-id="chainId" class="h-6 w-6" :url="selectedToken?.logoURI" />
      <span class="inline-flex items-center gap-[6px] w-full justify-between">
        {{ selectedToken?.symbol }}
        <ChevronDownSVG class="w-5 text-slate-400 -rotate-90" />
      </span>
    </template>
  </button>
</template>

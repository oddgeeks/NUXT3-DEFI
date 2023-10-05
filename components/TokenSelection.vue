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
    class="inline-flex h-fit items-center gap-2.5 rounded-2xl bg-white py-3 pl-[14px] pr-3 text-sm uppercase dark:bg-gray-900"
    @click="handleTokenSelection"
  >
    <div v-if="pending" class="loading-box my-1 h-5 w-20 rounded-lg" />
    <template v-else>
      <SafeTokenLogo :network-logo-class="networkLogoClass" :chain-id="chainId" class="h-6 w-6" :url="selectedToken?.logoURI" />
      <span class="inline-flex w-full items-center justify-between gap-[6px]">
        {{ selectedToken?.symbol }}
        <ChevronDownSVG class="w-5 -rotate-90 text-slate-400" />
      </span>
    </template>
  </button>
</template>

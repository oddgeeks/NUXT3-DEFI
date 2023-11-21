<script setup lang="ts">
import { Tippy } from 'vue-tippy'

const props = defineProps<{
  tokenBalance: IBalance
  buttonClass?: string
  showLabel?: boolean
}>()
const { $t } = useNuxtApp()
const balance = computed(() => props.tokenBalance as IBalance)

const {
  interactable,
  isBridgeDisabled,
  isSwapDisabled,
  nonAuthorised,
  fuseDisabled,
} = useGraph(balance)

const { isSafeBackupSigner } = useMfa()

const errorMessage = computed(() => {
  if (nonAuthorised.value) {
    return $t('nonAuthorized', {
      network: chainIdToName(balance.value.chainId),
    })
  }

  if (fuseDisabled.value)
    return $t('fuseNotSupported')

  if (isSafeBackupSigner.value)
    return $t('disabledBackupSigner')
})

const buttonClasses = computed(() => {
  return `sm:h-9 sm:w-9 h-7.5 w-7.5 items-center justify-center !p-0${props.buttonClass ? ` ${props.buttonClass}` : ''}`
})

function getTippyProps(content: string) {
  return {
    arrow: true,
    arrowType: 'round',
    animation: 'fade',
    content,
  }
}
</script>

<template>
  <Tippy
    :content="errorMessage"
    interactive
    tag="div"
    allow-h-t-m-l
    class="flex items-center justify-center gap-[15px]"
  >
    <div class="flex flex-col items-center justify-center gap-2">
      <CommonButton
        v-tippy="!showLabel && getTippyProps('Send')"
        :disabled="!interactable"
        :class="buttonClasses"
        @click="openSendModal(tokenBalance.chainId, tokenBalance.address)"
      >
        <SvgoArrowRight class="h-4 w-4 -rotate-45" />
      </CommonButton>
      <span v-if="showLabel" class="text-sm font-medium text-gray-400">
        Send
      </span>
    </div>

    <div class="flex flex-col items-center justify-center gap-2">
      <CommonButton
        v-tippy="!showLabel && getTippyProps('Swap')"
        :disabled="!interactable || isSwapDisabled"
        :class="buttonClasses"
        @click="openSwapModal(tokenBalance.address, tokenBalance.chainId)"
      >
        <SvgoRefresh class="h-3 w-3" />
      </CommonButton>
      <span v-if="showLabel" class="text-sm font-medium text-gray-400">
        Swap
      </span>
    </div>

    <div class="flex flex-col items-center justify-center gap-2">
      <CommonButton
        v-tippy="!showLabel && getTippyProps('Bridge')"
        :disabled="!interactable || isBridgeDisabled"
        :class="buttonClasses"
        @click="openBridgeModal(tokenBalance.address, tokenBalance.chainId)"
      >
        <SvgoBridge class="h-3 w-3" />
      </CommonButton>
      <span v-if="showLabel" class="text-sm font-medium text-gray-400">
        Bridge
      </span>
    </div>
  </Tippy>
</template>

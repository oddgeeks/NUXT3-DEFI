<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'
import SVGAlert from '~/assets/images/icons/exclamation-octagon.svg?component'
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'

defineProps<{
  connection: any
  loading: boolean
}>()

defineEmits(['connect'])

const isExpertMode = inject('isExpertMode') as Ref<boolean>
const connectionChainId = inject('connectionChainId') as Ref<number>

const detailsRef = ref<HTMLDialogElement>()

function cancelExpertMode() {
  if (detailsRef.value)
    detailsRef.value.open = false
}

function confirmExpertMode() {
  if (detailsRef.value)
    detailsRef.value.open = false
  isExpertMode.value = true
}

function exitExpertMode() {
  connectionChainId.value = 1
  isExpertMode.value = false
}
</script>

<template>
  <form
    v-focus
    tabindex="0"
    class="space-y-8 focus:outline-none"
    @keypress.enter="$emit('connect')"
    @submit.prevent="$emit('connect')"
  >
    <div class="flex flex-col items-center space-y-8">
      <div v-if="connection.peerMeta.icons.length" class="w-10 h-10">
        <img
          class="w-full h-full object-fit"
          referrerpolicy="no-referrer"
          :src="
            connection.peerMeta.icons[connection.peerMeta.icons.length - 1]
          "
        >
      </div>

      <span> {{ connection.peerMeta.name }} Wants to Connect </span>
    </div>

    <div class="flex flex-col gap-7.5">
      <p class="text-slate-400 text-xs text-center font-medium">
        You need the Avocado web app to be open to initiate transactions. You
        will not receive transaction requests when it is not open.
      </p>

      <div class="text-primary text-sm text-center">
        {{ connection.peerMeta.url }}
      </div>
      <details v-show="!isExpertMode" ref="detailsRef">
        <summary
          class="text-xs text-slate-600 flex items-center mx-auto gap-[6px] w-fit cursor-pointer"
        >
          Expert mode
          <SVGAlert />
        </summary>
        <div
          class="rounded-5 bg-orange-400 bg-opacity-10 mt-5 p-4 flex justify-center items-center flex-col"
        >
          <SVGInfo class="w-6 text-orange mb-2.5" />
          <p
            class="text-orange text-xs leading-5 font-medium text-center mb-4"
          >
            Would you like to manually switch Network? Some things may not
            behave as expected.
          </p>
          <div class="flex w-full gap-4">
            <CommonButton
              class="flex-1 justify-center"
              @click="cancelExpertMode"
            >
              Cancel
            </CommonButton>
            <CommonButton
              color="orange"
              class="flex-1 justify-center items-center gap-2"
              @click="confirmExpertMode"
            >
              <SVGAlert />
              Yes
            </CommonButton>
          </div>
        </div>
      </details>
    </div>

    <div v-if="isExpertMode">
      <div class="mb-2.5 flex items-center justify-between">
        <p class="text-orange text-sm flex items-center gap-2">
          Network
          <SVGInfo />
        </p>
        <button
          type="button"
          class="flex dark:bg-slate-800 items-center justify-center w-5 h-5 rounded-full"
          @click="exitExpertMode"
        >
          <SVGX class="w-2.5 h-2.5" />
        </button>
      </div>
      <CommonSelect
        v-model="connectionChainId"
        label-key="name"
        value-key="chainId"
        :options="availableNetworks"
      >
        <template #button-prefix>
          <ChainLogo class="w-6 h-6" :chain="connectionChainId" />
        </template>
        <template #item-prefix="{ value }">
          <ChainLogo class="w-6 h-6" :chain="value" />
        </template>
      </CommonSelect>
    </div>
    <CommonButton
      type="submit"
      :loading="loading"
      class="w-full justify-center"
      size="lg"
    >
      Approve
    </CommonButton>
  </form>
</template>

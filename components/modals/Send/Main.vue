<script setup lang='ts'>
const props = defineProps({
  chainId: {
    type: [String, Number],
    required: true,
  },
  address: {
    type: String,
    required: false,
  },
  contact: {
    type: Object as PropType<IContact>,
    required: false,
  },
})

const emit = defineEmits(['destroy'])

const { initialize, reset, isCrossChain, data, steps, activeStep } = useSend()

const contact = ref<IContact | undefined>(props.contact)

provide('destroy', () => emit('destroy'))

initialize({
  fromChainId: +props.chainId,
  address: props.address,
  contact: props.contact,
})

async function handleEdit() {
  if (!props.contact)
    return

  const result = await openAddContactModal(
    props.contact.name,
    props.contact.address,
    props.contact.chainId,
    true,
  )

  if (result.success) {
    contact.value = result.payload as IContact

    data.value.address = contact.value.address
  }
}

onUnmounted(() => {
  reset()
})
</script>

<template>
  <div>
    <div class="flex gap-[14px] mb-7.5">
      <div class="w-10 h-10 rounded-full items-center flex justify-center bg-primary">
        <SvgoArrowRight class="-rotate-45" />
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-[20px]">
          {{ isCrossChain ? 'Cross-chain Send' : 'Send' }}
          <span v-if="contact"> to {{ contact.name }}  </span>
        </h1>
        <h2 class="font-medium text-xs text-slate-400 leading-5">
          Transfer token across all the supported chains.
        </h2>
      </div>
    </div>
    <div
      v-if="contact"
      class="flex items-center rounded-5 mb-5 -mt-3 pl-5 pr-4 py-5 dark:bg-gray-850 bg-slate-50 justify-between w-full"
    >
      <div class="flex items-center gap-3">
        <ChainLogo :stroke="false" class="w-7 h-7" :chain="contact.chainId" />
        <Copy :text="contact.address">
          <template #content>
            <span class="dark:text-white text-slate-900">{{
              shortenHash(contact.address)
            }}</span>
          </template>
        </Copy>
      </div>
      <CommonButton
        :disabled="contact.owner"
        color="white"
        class="justify-center dark:bg-slate-800 bg-slate-150 !px-4"
        @click="handleEdit()"
      >
        Edit
      </CommonButton>
    </div>

    <component :is="steps[activeStep].component" />
  </div>
</template>

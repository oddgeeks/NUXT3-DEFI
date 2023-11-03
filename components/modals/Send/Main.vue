<script setup lang='ts'>
const props = defineProps<{
  chainId: string | number
  address?: string
  contact?: IContact
  bookmark?: IBookmark
}>()

const emit = defineEmits(['destroy'])

const { initialize, reset, isCrossChain, data, actualAddress, steps, activeStep } = useSend(props.bookmark?.sendData)

const reactiveBookmark = ref(props.bookmark)

const contact = ref<IContact | undefined>(props.contact)

provide('destroy', () => emit('destroy'))

initialize({
  fromChainId: +props.chainId,
  address: props.address,
  contact: props.contact,
})

async function handleUpdateBookmark() {
  const { success, payload } = await openCreateBookmarkModal({
    ...props.bookmark,
    edit: true,
    sendData: {
      ...data.value,
      address: actualAddress.value,
    },
  })

  if (success)
    reactiveBookmark.value = payload
}

async function handleCreateBookmark() {
  const { success, payload } = await openCreateBookmarkModal({
    chainId: props.chainId,
    sendData: {
      ...data.value,
      address: actualAddress.value,
    },
    type: 'transfer',
  })

  if (success && payload)
    reactiveBookmark.value = payload
}

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
    <div class="mb-7.5 flex gap-[14px]">
      <CommonTxTypeIcon class="h-10 w-10">
        <template #icon>
          <SvgoArrowRight class="-rotate-45" />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-[20px]">
          {{ isCrossChain ? 'Cross-chain Send' : 'Send' }}
          <span v-if="contact"> to {{ contact.name }}  </span>
        </h1>
        <h2 class="text-xs font-medium leading-5 text-gray-400">
          Transfer tokens to any address on selected chain.
        </h2>
      </div>
    </div>
    <div
      v-if="contact"
      class="-mt-3 mb-5 flex w-full items-center justify-between rounded-5 bg-slate-50 py-5 pl-5 pr-4 dark:bg-gray-850"
    >
      <div class="flex items-center gap-3">
        <ChainLogo :stroke="false" class="h-7 w-7" :chain="contact.chainId" />
        <Copy :text="contact.address">
          <template #content>
            <span class="text-slate-900 dark:text-white">{{
              shortenHash(contact.address)
            }}</span>
          </template>
        </Copy>
      </div>
      <CommonButton
        :disabled="contact.owner"
        color="white"
        class="justify-center bg-slate-150 !px-4 dark:bg-gray-900"
        @click="handleEdit()"
      >
        Edit
      </CommonButton>
    </div>

    <component :is="steps[activeStep].component" />

    <ManageBookmark v-if="activeStep === 1" class="mt-5" :bookmark="reactiveBookmark" @update-bookmark="handleUpdateBookmark" @create-bookmark="handleCreateBookmark" />
  </div>
</template>

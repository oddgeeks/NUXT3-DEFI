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
    <ModalTitle class="border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <template #icon>
        <SvgoArrowRight class="-rotate-45" />
      </template>
      <template #title>
        {{ isCrossChain ? 'Cross-chain Send' : 'Send' }}
        <span v-if="contact"> to {{ contact.name }}  </span>
      </template>
      <template #subtitle>
        Transfer tokens to any address on selected chain.
      </template>
    </ModalTitle>
    <div class="p-5 sm:p-7.5 sm:pt-5">
      <div
        v-if="contact"
        class="-mt-3 mb-5 flex w-full items-center justify-between rounded-5 bg-gray-850 py-5 pl-5 pr-4"
      >
        <div class="flex items-center gap-3">
          <ChainLogo :stroke="false" class="h-7 w-7" :chain="contact.chainId" />
          <Copy :text="contact.address">
            <template #content>
              <span>{{
                shortenHash(contact.address)
              }}</span>
            </template>
          </Copy>
        </div>
        <CommonButton
          :disabled="contact.owner"
          color="white"
          class="justify-center bg-gray-900 !px-4"
          @click="handleEdit()"
        >
          Edit
        </CommonButton>
      </div>

      <component :is="steps[activeStep].component" />

      <ManageBookmark v-if="activeStep === 1" :class="!isCrossChain ? 'absolute bottom-7.5 right-7.5' : 'mt-5'" :bookmark="reactiveBookmark" @update-bookmark="handleUpdateBookmark" @create-bookmark="handleCreateBookmark" />
    </div>
  </div>
</template>

<script setup lang="ts">
import DeleteSVG from '~/assets/images/icons/delete.svg?component'

defineProps({
  contact: {
    type: Object as PropType<IContact>,
    required: true,
  },
})

const { deleteContact, getSentTimes } = useContacts()
const { tokenBalances } = useAvocadoSafe()

function hasAvailableTokens(chainId: number | string) {
  return tokenBalances.value.filter(t => t.chainId == chainId).length > 0
}

async function handleDeletingContact(contact: IContact) {
  const { success } = await openDeleteContactModal()

  if (success)
    deleteContact(contact)
}
</script>

<template>
  <div class="flex flex-col gap-5 rounded-[20px] bg-slate-50 px-5 pb-4.5 pt-4 dark:bg-gray-850 sm:hidden">
    <div class="flex justify-between">
      <span class="text-sm font-semibold text-gray-400">{{
        contact.name
      }}</span>
      <button
        class="text-red-alert disabled:text-gray-400 disabled:opacity-40" :disabled="contact.owner || contact.notDeletable"
        @click="handleDeletingContact(contact)"
      >
        <DeleteSVG class="h-4 w-4" />
      </button>
    </div>
    <div class="flex items-center gap-3 rounded-7.5 border-2 px-4.5 py-3 dark:border-slate-700">
      <ChainLogo :stroke="false" class="h-6.5 w-6.5" :chain="contact.chainId" />
      <Copy :text="contact.address" class="flex-1 justify-between">
        <template #content>
          <span class="text-slate-900 dark:text-white">{{
            shortenHash(contact.address)
          }}</span>
        </template>
      </Copy>
    </div>
    <span v-if="getSentTimes(contact) !== ''" class="text-xs text-gray-400">
      {{ getSentTimes(contact) }}
    </span>
    <div class="flex gap-2.5">
      <CommonButton
        color="white" class="flex-1 items-center justify-center" :disabled="contact.owner || contact.notEditable" @click="
          openAddContactModal(
            contact.name,
            contact.address,
            contact.chainId,
            true,
          )
        "
      >
        Edit
      </CommonButton>
      <CommonButton
        color="white" class="flex-1 items-center justify-center gap-2.5"
        :disabled="!!contact.chainId && !hasAvailableTokens(contact.chainId)"
        @click="openSendModal(contact.chainId || 1, undefined, contact)"
      >
        Send
        <CommonTxTypeIcon class="p-1" :disabled="!!contact.chainId && !hasAvailableTokens(contact.chainId)" color="light">
          <template #icon>
            <SvgoArrowRight class="h-3 w-3 -rotate-45" />
          </template>
        </CommonTxTypeIcon>
      </CommonButton>
    </div>
  </div>
</template>

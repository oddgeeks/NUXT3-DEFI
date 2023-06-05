<script setup lang="ts">
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
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
  <div
    class="flex flex-col sm:hidden dark:bg-gray-850 bg-slate-50 px-5 pt-4 pb-4.5 rounded-[20px] gap-5"
  >
    <div class="flex justify-between">
      <span class="text-sm font-semibold text-slate-400">{{
        contact.name
      }}</span>
      <button class="disabled:text-slate-400 disabled:opacity-40 text-red-alert" :disabled="contact.owner" @click="handleDeletingContact(contact)">
        <DeleteSVG class="w-4 h-4" />
      </button>
    </div>
    <div
      class="flex items-center gap-3 rounded-7.5 px-4.5 py-3 border-2 dark:border-slate-700"
    >
      <ChainLogo
        :stroke="false"
        class="w-6.5 h-6.5"
        :chain="contact.chainId"
      />
      <Copy :text="contact.address" class="flex-1 justify-between">
        <template #content>
          <span class="dark:text-white text-slate-900">{{
            shortenHash(contact.address)
          }}</span>
        </template>
      </Copy>
    </div>
    <span
      v-if="getSentTimes(contact) !== ''"
      class="text-slate-400 text-xs"
    >
      {{ getSentTimes(contact) }}
    </span>
    <div class="flex gap-2.5">
      <CommonButton
        color="white"
        class="flex-1 justify-center items-center"
        :disabled="contact.owner"
        @click="
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
        color="white"
        class="flex-1 justify-center items-center gap-2.5"
        :disabled="!!contact.chainId && !hasAvailableTokens(contact.chainId)"
        @click="openSendModal(contact.chainId || 1, undefined, contact)"
      >
        Send
        <div
          class="rounded-full bg-primary p-1 text-white"
          :class="{
            'dark:bg-slate-600 bg-slate-300 dark:!text-slate-500 !text-slate-400':
              !!contact.chainId && !hasAvailableTokens(contact.chainId),
          }"
        >
          <ArrowRight class="-rotate-45 w-3 h-3" />
        </div>
      </CommonButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import DeleteSVG from '~/assets/images/icons/delete.svg?component'

const props = defineProps({
  contact: {
    type: Object as PropType<IContact>,
    required: true,
  },
})

const { deleteContact, getSentTimes } = useContacts()
const { tokenBalances } = useAvocadoSafe()

const sentTimes = computed(() => getSentTimes(props.contact))

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
  <tr class="contact-row cursor-pointer text-sm font-semibold">
    <td class="pl-7.5 text-sm">
      <span class="relative">{{ contact.name }}</span>
    </td>
    <td class="py-6 pr-10">
      <div class="relative flex items-center justify-between gap-10">
        <div class="flex items-center gap-2.5">
          <ChainLogo :stroke="false" class="h-[22px] w-[22px]" :chain="contact.chainId" />
          <span>{{ shortenHash(contact.address) }}</span>
          <Copy icon-only :text="contact.address" />
        </div>
        <span class="text-gray-400">{{ sentTimes }}</span>
        <div class="flex items-center gap-9">
          <div class="flex gap-4">
            <CommonButton
              color="white" class="h-10 items-center !px-4" :disabled="contact.owner || contact.notEditable" @click="
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
              color="white" class="h-10 items-center gap-2.5 !px-4"
              :disabled="!!contact.chainId && !hasAvailableTokens(contact.chainId)" @click="
                openSendModal(contact.chainId || 1, undefined, contact)
              "
            >
              Send
              <CommonTxTypeIcon
                class="p-1.5" :disabled="!!contact.chainId && !hasAvailableTokens(contact.chainId)"
                color="light"
              >
                <template #icon>
                  <SvgoArrowRight class="h-3.5 w-3.5 -rotate-45" />
                </template>
              </CommonTxTypeIcon>
            </CommonButton>
          </div>
          <button
            class="text-red-alert disabled:text-gray-400 disabled:opacity-40" :disabled="contact.owner || contact.notDeletable"
            @click="handleDeletingContact(contact)"
          >
            <DeleteSVG class="h-4 w-4" />
          </button>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.contact-row>td>a {
  @apply py-2 w-full inline-flex;
}

.contact-row>td:first-child {
  @apply pl-7.5;
}

.contact-row>td>a {
  @apply py-[18.5px] relative;
}

.contact-row>td {
  transform-style: preserve-3d;
  white-space: nowrap;
  @apply md:pl-0 pl-4;
}

.contact-row:hover>td::before {
  content: "";
  transform: translateZ(-1px) translateX(-50%) translateY(-50%);
  @apply absolute top-1/2 left-1/2 dark:bg-slate-850 bg-slate-150 pointer-events-none;
  width: calc(100% + 1px);
  height: calc(100% - 16px);
}

.contact-row:hover>td:first-child:before {
  @apply rounded-l-5 ml-2.5;
}

.contact-row:hover>td:last-child:before {
  @apply rounded-r-5;
  translate: -10px 0;
}
</style>

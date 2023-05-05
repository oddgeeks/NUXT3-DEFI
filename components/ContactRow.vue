<script setup lang="ts">
import ArrowRight from '~/assets/images/icons/arrow-right.svg'
import DeleteSVG from '~/assets/images/icons/delete.svg'

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
  <tr
    class="contact-row text-sm font-semibold cursor-pointer"
  >
    <td class="pl-7.5 text-sm">
      <span class="relative">{{ contact.name }}</span>
    </td>
    <td class="pr-10 py-6">
      <div
        class="relative flex items-center justify-between gap-10"
      >
        <div class="flex items-center gap-2.5">
          <ChainLogo
            :stroke="false"
            class="w-[22px] h-[22px]"
            :chain="contact.chainId"
          />
          <span>{{ shortenHash(contact.address) }}</span>
        </div>
        <span class="text-slate-400">{{
          getSentTimes(contact)
        }}</span>
        <div class="flex items-center gap-9">
          <div class="flex gap-4">
            <CommonButton
              color="white"
              class="items-center h-10 !px-4"
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
              class="items-center gap-2.5 h-10 !px-4"
              :disabled="!!contact.chainId && !hasAvailableTokens(contact.chainId)"
              @click="
                openSendModal(contact.chainId, undefined, contact)
              "
            >
              Send
              <div
                class="rounded-full bg-primary p-1.5 text-white"
                :class="{
                  'dark:bg-slate-600 bg-slate-300 dark:!text-slate-500 !text-slate-400':
                    !!contact.chainId && !hasAvailableTokens(contact.chainId),
                }"
              >
                <ArrowRight class="-rotate-45 w-3.5 h-3.5" />
              </div>
            </CommonButton>
          </div>
          <button class="disabled:text-slate-400 disabled:opacity-40 text-red-alert" :disabled="contact.owner" @click="handleDeletingContact(contact)">
            <DeleteSVG class="w-4 h-4" />
          </button>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.contact-row > td > a {
  @apply py-2 w-full inline-flex;
}

.contact-row > td:first-child {
  @apply pl-7.5;
}

.contact-row > td > a {
  @apply py-[18.5px] relative;
}

.contact-row > td {
  transform-style: preserve-3d;
  white-space: nowrap;
  @apply md:pl-0 pl-4;
}

.contact-row:hover > td::before {
  content: "";
  transform: translateZ(-1px) translateX(-50%) translateY(-50%);
  @apply absolute top-1/2 left-1/2 dark:bg-slate-850 bg-slate-150 pointer-events-none;
  width: calc(100% + 1px);
  height: calc(100% - 16px);
}

.contact-row:hover > td:first-child:before {
  @apply rounded-l-5 ml-2.5;
}

.contact-row:hover > td:last-child:before {
  @apply rounded-r-5;
  translate: -10px 0;
}
</style>

<script setup lang="ts">
import Fuse from 'fuse.js'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'

definePageMeta({
  middleware: 'auth',
})

const { account } = useWeb3()
const { safeAddress } = useAvocadoSafe()
const { safeContacts, fetchTransferCounts } = useContacts()

const searchQuery = ref('')

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const search = useDebounceFn((e: Event) => {
  const el = e.target as HTMLInputElement
  searchQuery.value = el.value
}, 200)

const filteredContacts = computed(() => {
  if (!safeContacts.value)
    return []

  if (!searchQuery.value || searchQuery.value.trim().length === 0)
    return safeContacts.value

  const fuse = new Fuse(safeContacts.value, {
    keys: ['name', 'address'],
    threshold: 0.2,
  })

  return fuse.search(searchQuery.value).map(result => result.item)
})

const downloadContactsAsCSV = () => {
  let csvContent = 'Address,Name,ChainId\n'

  filteredContacts.value.forEach(row => {
    csvContent += row.address + "," + row.name + "," + row.chainId + "\n"
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'Contacts.csv'
  a.click()
  a.remove()
}

watch(safeAddress, () => {
  if (!safeAddress.value)
    return

  fetchTransferCounts()
}, {
  immediate: true,
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-7.5">
    <div class="flex flex-1 flex-col gap-5">
      <h2 class="inline-flex items-center text-sm font-semibold sm:text-base">
        Contacts
      </h2>
      <div
        class="flex flex-col-reverse items-center gap-x-5 gap-y-7.5 sm:flex-row"
        :class="{ 'pointer-events-none blur': !account }"
      >
        <CommonInput
          class="w-full flex-1"
          :class="{
            'hidden sm:block':
              !safeContacts || safeContacts.length === 0,
          }"
          name="Contact Search"
          type="search"
          placeholder="Search contact"
          @input="search"
        >
          <template #prefix>
            <SearchSVG class="mr-2 shrink-0" />
          </template>
        </CommonInput>
        <button class="flex items-center justify-center gap-2 px-5 hover:text-slate-400" @click="downloadContactsAsCSV()">
          <SvgoDownload class="w-5 h-5" />
          Export
        </button>
        <CommonButton
          :disabled="!safeAddress"
          size="lg"
          class="flex w-full items-center justify-center gap-2 px-5 sm:w-fit"
          @click="openAddContactModal()"
        >
          <PlusSVG />
          Create Contact
        </CommonButton>
      </div>
      <div
        style="scrollbar-gutter: stable; overflow-y: overlay"
        class="scroll-style flex h-[530px] max-h-[530px] flex-col gap-4 overflow-auto sm:rounded-[25px] sm:bg-slate-50 dark:sm:bg-gray-850 md:overflow-x-hidden"
        :class="{ 'pointer-events-none !overflow-hidden blur': !account }"
      >
        <div
          v-if="account && filteredContacts.length === 0"
          class="flex h-full w-full items-center justify-center"
        >
          No contacts
        </div>
        <template v-else>
          <table class="hidden w-full sm:table">
            <thead>
              <tr
                class="border-b border-slate-150 text-left text-sm font-medium text-gray-400 dark:border-slate-800"
              >
                <th class="py-6 pl-7.5 text-left">
                  Name
                </th>
                <th class="w-[70%] pr-10">
                  Address
                </th>
              </tr>
            </thead>
            <ClientOnly>
              <tbody class="divide-y divide-slate-150 dark:divide-slate-800">
                <ContactRow v-for="contact in filteredContacts" :key="contact.address + contact.chainId + contact.name" :contact="contact" />
              </tbody>
            </ClientOnly>
          </table>
          <ClientOnly>
            <MobileContactRow
              v-for="contact in filteredContacts"
              :key="contact.address + contact.chainId + contact.name" :contact="contact"
            />
          </ClientOnly>
        </template>
      </div>
    </div>
  </div>
</template>

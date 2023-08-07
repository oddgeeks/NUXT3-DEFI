<script setup lang="ts">
import Fuse from 'fuse.js'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'

definePageMeta({
  middleware: 'auth',
})

const { account } = useWeb3()
const { safeAddress } = useAvocadoSafe()
const { safeContacts } = useContacts()

const searchQuery = ref('')

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value
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
</script>

<template>
  <div class="flex flex-col gap-7.5 flex-1">
    <div class="flex gap-5 flex-col flex-1">
      <h2 class="sm:text-base text-sm font-semibold inline-flex items-center">
        Contacts
      </h2>
      <div
        class="flex sm:flex-row flex-col-reverse items-center gap-x-5 gap-y-7.5"
        :class="{ 'blur pointer-events-none': !account }"
      >
        <CommonInput
          class="flex-1 w-full"
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
            <SearchSVG class="shrink-0 mr-2" />
          </template>
        </CommonInput>

        <CommonButton
          :disabled="!safeAddress"
          size="lg"
          class="flex items-center justify-center gap-2 px-5 w-full sm:w-fit"
          @click="openAddContactModal()"
        >
          <PlusSVG />
          Create Contact
        </CommonButton>
      </div>
      <div
        style="scrollbar-gutter: stable; overflow-y: overlay"
        class="overflow-y-auto overflow-x-auto dark:sm:bg-gray-850 sm:bg-slate-50 sm:rounded-[25px] md:overflow-x-hidden h-[530px] max-h-[530px] scroll-style flex flex-col gap-4"
        :class="{ '!overflow-hidden blur pointer-events-none': !account }"
      >
        <div
          v-if="account && filteredContacts.length === 0"
          class="w-full h-full flex items-center justify-center"
        >
          No contacts
        </div>
        <template v-else>
          <table class="hidden sm:table w-full">
            <thead>
              <tr
                class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
              >
                <th class="text-left py-6 pl-7.5">
                  Name
                </th>
                <th class="pr-10 w-[70%]">
                  Address
                </th>
              </tr>
            </thead>
            <ClientOnly>
              <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
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

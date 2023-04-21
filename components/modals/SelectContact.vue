<script lang="ts" setup>
import Fuse from 'fuse.js'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'

const emit = defineEmits(['resolve', 'reject'])

const { contacts, getSentTimes } = useContacts()
const { safeAddress } = useAvocadoSafe()

const searchQuery = ref('')

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value
}, 200)

const filteredContacts = computed(() => {
  const _contacts = contacts.value[safeAddress.value]
  if (!_contacts)
    return []

  if (!searchQuery.value || searchQuery.value.trim().length === 0)
    return _contacts

  const fuse = new Fuse(_contacts, {
    keys: ['name', 'address'],
    threshold: 0.2,
  })
  
  return fuse.search(searchQuery.value).map(result => result.item)
})
</script>

<template>
  <form>
    <h1 class="text-lg text-center leading-5 mb-7.5">
      Contacts
    </h1>
    <div class="flex flex-col gap-4 sm:gap-3.5">
      <CommonInput
        class="flex-1 w-full"
        :class="{
          'hidden sm:block':
            !contacts[safeAddress] || contacts[safeAddress].length === 0,
        }"
        input-classes="!py-3"
        name="Contact Search"
        type="search"
        placeholder="Search"
        @input="search"
      >
        <template #prefix>
          <SearchSVG class="shrink-0 mr-2 w-5 h-5" />
        </template>
      </CommonInput>
      <ul
        v-if="filteredContacts.length"
        class="overflow-auto scroll-style h-64 flex flex-col gap-4 sm:gap-3.5"
      >
        <li v-for="contact in filteredContacts" :key="contact.address + contact.chainId">
          <button
            class="w-full flex flex-col dark:bg-gray-850 bg-slate-50 px-4 py-3 rounded-[20px] gap-2.5"
            type="button"
            @click="emit('resolve', true, contact)"
          >
            <div class="flex justify-between w-full">
              <span class="text-sm font-semibold">{{ contact.name }}</span>
              <ArrowRight class="text-slate-400 w-4 h-4" />
            </div>
            <div class="text-xs flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <ChainLogo
                  :stroke="false"
                  class="w-4.5 h-4.5"
                  :chain="contact.chainId"
                />
                <span class="dark:text-white text-slate-900">{{
                  shortenHash(contact.address)
                }}</span>
              </div>
              <span class="text-slate-400">{{ getSentTimes(contact) }}</span>
            </div>
          </button>
        </li>
      </ul>
      <div v-else class="flex flex-col items-center justify-center h-64">
        <p class="text-slate-400">
          Nothing could be found
        </p>
      </div>
    </div>
  </form>
</template>

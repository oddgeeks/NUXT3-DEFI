<script lang="ts" setup>
import Fuse from 'fuse.js'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'

const props = defineProps({
  chainId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['resolve', 'reject'])

const { safeContacts, getSentTimes } = useContacts()

const searchQuery = ref('')

const search = useDebounceFn((e: Event) => {
  const el = e.target as HTMLInputElement
  searchQuery.value = el.value
}, 200)

const filteredContacts = computed(() => {
  const _contacts = safeContacts.value as IContact[]
  if (!_contacts)
    return []

  const filteredContacts = props.chainId ? _contacts.filter(contact => (contact.chainId == props.chainId) || (!contact.chainId)) : _contacts

  if (!searchQuery.value || searchQuery.value.trim().length === 0)
    return filteredContacts

  const fuse = new Fuse(filteredContacts, {
    keys: ['name', 'address'],
    threshold: 0.2,
  })

  return fuse.search(searchQuery.value).map(result => result.item)
})
</script>

<template>
  <form>
    <h1 class="mb-7.5 text-center text-lg leading-5">
      Contacts
    </h1>
    <div class="flex flex-col gap-4 sm:gap-3.5">
      <CommonInput
        class="w-full flex-1"
        :class="{
          'hidden sm:block':
            !safeContacts || safeContacts.length === 0,
        }"
        input-classes="!py-3"
        name="Contact Search"
        type="search"
        placeholder="Search"
        autofocus
        @input="search"
      >
        <template #prefix>
          <SearchSVG class="mr-2 h-5 w-5 shrink-0" />
        </template>
      </CommonInput>
      <ul
        v-if="filteredContacts.length"
        class="scroll-style flex h-64 flex-col gap-4 overflow-auto sm:gap-3.5"
      >
        <li v-for="contact in filteredContacts" :key="contact.address + contact.chainId">
          <button
            class="flex w-full flex-col gap-2.5 rounded-[20px] bg-gray-850 px-4 py-3"
            type="button"
            @click="emit('resolve', true, contact)"
          >
            <div class="flex w-full justify-between">
              <span class="text-sm font-semibold">{{ contact.name }}</span>
              <ArrowRight class="h-4 w-4 text-gray-400" />
            </div>
            <div class="flex w-full items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <ChainLogo
                  :stroke="false"
                  class="h-4.5 w-4.5"
                  :chain="contact.chainId"
                />
                <span>{{
                  shortenHash(contact.address)
                }}</span>
              </div>
              <span class="text-gray-400">{{ getSentTimes(contact) }}</span>
            </div>
          </button>
        </li>
      </ul>
      <div v-else class="flex h-64 flex-col items-center justify-center">
        <p class="text-gray-400">
          Nothing could be found
        </p>
      </div>
    </div>
  </form>
</template>

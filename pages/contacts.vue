<script setup lang="ts">
import Fuse from 'fuse.js'
import { read, utils } from 'xlsx'
import { isAddress } from 'ethers/lib/utils'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'

definePageMeta({
  middleware: 'auth',
})

const { account } = useWeb3()
const { safeAddress } = useAvocadoSafe()
const { safeContacts, fetchTransferCounts, contacts, addContact } = useContacts()

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

function importCSVFile() {
  const file_input = document.createElement('input')
  file_input.type = 'file'
  file_input.accept = 'text/plain, .numbers, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
  file_input.onchange = () => {
    if (!file_input.files)
      return
    const file = file_input.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result

        const res = read(csvContent, {
          raw: true,
        })

        const importedContacts: IContact[] = utils.sheet_to_json(res.Sheets[res.SheetNames[0]])

        const filteredContacts = importedContacts.filter((contact) => {
          if (!contact.address || !contact.name)
            return false

          if (!isAddress(contact.address))
            return false

          const chainId = contact.chainId ? String(contact.chainId).trim() : ''

          const existingContact = contacts.value.find(i => isAddressEqual(i.address, contact.address) && String(i.chainId) == chainId)

          if (existingContact)
            return false

          const isNetworkAvailable = chainId ? availableNetworks.some(i => String(i.chainId) == String(chainId)) : true

          return isNetworkAvailable
        })

        if (!filteredContacts.length) {
          notify({
            type: 'error',
            message: 'No valid contacts found',
          })
          return
        }

        for (const contact of filteredContacts) {
          addContact({
            address: contact.address,
            chainId: String(contact.chainId).trim(),
            name: contact.name,
          }, false)
        }

        fetchTransferCounts()

        notify({
          type: 'success',
          message: `${filteredContacts.length} contacts imported successfully`,
        })

        file_input.remove()
      }
      catch (e) {
        notify({
          type: 'error',
          message: 'Invalid CSV file',
        })
      }
    }

    reader.onerror = () => {
      file_input.remove()
      notify({
        type: 'error',
        message: 'Invalid CSV file',
      })
    }

    reader.readAsArrayBuffer(file)
  }
  file_input.click()
}

function downloadContactsAsCSV() {
  let csvContent = 'address,name,chainId\n'

  filteredContacts.value.forEach((row) => {
    csvContent += `${row.address},${row.name},${row.chainId || ' '}\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url

  const dateLabel = new Date().toISOString().split('T')[0]
  a.download = `Contacts-${dateLabel}.csv`
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
        class="flex flex-col-reverse items-center gap-5 sm:flex-row sm:gap-7.5"
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
        <div class="flex w-full gap-10 md:w-auto">
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-full py-2 font-medium hover:text-primary md:flex-auto" @click="importCSVFile()">
            <SvgoImport class="h-5 w-5" />
            Import
          </button>
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-full py-2 font-medium hover:text-primary md:flex-auto" @click="downloadContactsAsCSV()">
            <SvgoExport class="h-5 w-5" />
            Export
          </button>
        </div>
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
        class="scroll-style flex flex-col gap-4 overflow-auto sm:h-[530px] sm:max-h-[530px] sm:rounded-[25px] sm:bg-gray-850 md:overflow-x-hidden"
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
                class="border-b border-gray-800 text-left text-sm font-medium text-gray-400"
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
              <tbody class="divide-y divide-gray-900">
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

<script setup lang="ts">
import Fuse from 'fuse.js'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect.svg'

const search = ref('')

const { sessions } = storeToRefs(useWalletConnectV2())

const filteredSessions = computed(() => {
  if (!search.value)
    return sessions.value

  const fuse = new Fuse(sessions.value || [], {
    keys: ['peer.metadata.name', 'peer.metadata.url'],
    threshold: 0.5,
  })

  const result = fuse.search(search.value)

  return result.map(i => i.item)
})
</script>

<template>
  <div>
    <ModalTitle class="border-b p-7.5 dark:border-gray-875">
      <template #icon-content>
        <SVGWalletConnect class="h-9 w-9" />
      </template>
      <template #title>
        Wallet Connections
      </template>
      <template #subtitle>
        Manage your wallets and use all the features of Avocado!
      </template>
    </ModalTitle>
    <div class="flex flex-col gap-2.5 px-7.5 pb-7.5 pt-4">
      <div class="flex items-center justify-between">
        <span class="text-sm">
          All Connections
        </span>
      </div>
      <CommonInput
        v-model="search" placeholder="Search name, URL" container-classes="rounded-[40px] !px-4"
        input-classes="!py-2.5" type="search"
      >
        <template #prefix>
          <SvgoSearch class="mr-2" />
        </template>
      </CommonInput>
      <div class="grid min-h-[220px] grid-cols-2 items-baseline gap-4">
        <WCSessionCardV2 v-for="session in filteredSessions" :key="session.peer.metadata.url" detailed :session="session" />
      </div>
    </div>
  </div>
</template>

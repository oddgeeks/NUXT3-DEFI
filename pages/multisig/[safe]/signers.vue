<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'

const route = useRoute()

if (!route.params.safe || !isAddress(route.params.safe as string))
  throw new Error('Safe address is required')

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const navigation = [
  {
    label: 'Add New Signer',
    icon: 'SvgoPlusCircle',
  },
  {
    label: 'Delete Signers',
    icon: 'SvgoTrash2',
  },
  {
    label: 'Copy Multisig setup between Networks',
    icon: 'SvgoCopy',
  },
  {
    label: 'Clone Gnosis Settings',
    icon: 'SvgoGnosis',
  },
]
</script>

<template>
  <div class="flex-1">
    <div class="flex flex-col gap-2.5">
      <h1 class="text-3xl/10 font-bold">
        Manage Multisig Signers
      </h1>
      <h2 class="text-sm text-gray-400 sm:max-w-lg">
        Signers are addresses that are required to sign transactions before they can be executed on the blockchain.
      </h2>
    </div>
    <div>
      <ul>
        <li v-for="item in navigation" :key="item.label">
          <button>
            <Component :is="item.icon" />
            {{ item.label }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

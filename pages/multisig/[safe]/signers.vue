<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'

const route = useRoute()
const { getSafe } = useSafe()

if (!route.params.safe || !isAddress(route.params.safe as string))
  throw new Error('Safe address is required')

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const navigation = [
  {
    label: 'Add New Signer',
    icon: 'SvgoPlusCircle',
    class: 'text-primary',
  },
  {
    label: 'Delete Signers',
    icon: 'SvgoTrash2',
    class: 'text-red-alert',
  },
  {
    label: 'Copy Multisig setup between Networks',
    icon: 'SvgoCopy',
  },
  {
    label: 'Clone Gnosis Settings',
    icon: 'SvgoSafe',
  },
]

const { data } = useAsyncData(
  `${route.params.safe}-signers`,
  async () => {
    const safe = await getSafe(route.params.safe as string)

    if (!safe)
      return

    return safe
  },
)
</script>

<template>
  <div class="flex flex-1 flex-col gap-7.5">
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-2.5">
        <h1 class="text-3xl/10 font-bold">
          Manage Multisig Signers
        </h1>
        <h2 class="text-sm text-gray-400 sm:max-w-lg">
          Signers are addresses that are required to sign transactions before they can be executed on the blockchain.
        </h2>
      </div>
      <div>
        <ul class="flex items-center gap-2.5">
          <li v-for="item in navigation" :key="item.label">
            <button :class="item.class" type="button" class="flex items-center gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-xs">
              <Component :is="item.icon" class="h-4.5 w-4.5" />
              {{ item.label }}
            </button>
          </li>
        </ul>
      </div>
    </div>
    <div v-if="data" class="grid grid-cols-3 gap-4.5">
      <template v-for="signers, chainId of data.signers" :key="chainId">
        <MultisigSignerCard v-if="!!signers.length" :safe="data" :chain-id="chainId" />
      </template>
    </div>
  </div>
</template>

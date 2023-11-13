<script setup lang="ts">
import { AbiFetcher } from '@instadapp/utils'
import { ethers } from 'ethers'

import { TransactionBuilder } from '@instadapp/transaction-builder'

const props = defineProps<{
  action: Action
  chainId: string | number
}>()

const decodedParams = computedAsync<IDecodedParams | undefined>(async () => {
  try {
    const network = availableNetworks.find(network => network.chainId == props.chainId)

    if (!network)
      return

    const supportedNetworkName = network.name.toLocaleLowerCase()

    if (!ABIfetcherSupportedNetworks.includes(supportedNetworkName))
      return

    const fetcher = new AbiFetcher()
    const jsonABI = await fetcher.get(props.action.target, supportedNetworkName)
    const iface = new ethers.utils.Interface(jsonABI)
    const parsed = iface.parseTransaction({ data: props.action.data })
    const builder = new TransactionBuilder(jsonABI)

    const inputs = builder.getMethodInputs(parsed.signature)

    return {
      method: parsed.signature,
      inputs,
      builder,
      args: parsed.args,
    }
  }
  catch (e) {
    console.log(e)
    return {
      inputs: [],
      args: [],
      method: '',
      builder: null,
    }
  }
})
</script>

<template>
  <details class="group px-5 sm:px-7.5">
    <summary class="flex cursor-pointer items-center justify-between text-xs">
      <dl class="flex w-full flex-col justify-between gap-2.5 text-sm sm:flex-row sm:items-center sm:gap-0">
        <dt class="text-gray-400">
          Target
        </dt>
        <dd class="flex items-center justify-between gap-2 break-all sm:w-[420px]">
          {{ action.target }}
          <SvgoChevronDown
            class="w-5 text-gray-400 group-open:rotate-180"
          />
        </dd>
      </dl>
    </summary>
    <div class="mt-5 flex flex-col gap-2.5">
      <div v-if="String(action.operation) === '1'" class="mb-2.5 flex w-fit items-center justify-between gap-2.5 rounded-[14px] border border-slate-700 px-4 py-2 text-sm">
        <SvgoInfo2 class="text-gray-500" />
        This is a delegate call transaction
      </div>
      <dl v-if="decodedParams" class="flex flex-col items-start justify-between gap-2.5 text-sm sm:flex-row sm:gap-0">
        <dt style="word-break: break-all;" class="max-w-[220px] text-gray-400">
          {{ decodedParams.method }}
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          <button class="text-primary" type="button" @click="openDecodedParamsModal(decodedParams)">
            View decoded params
          </button>
        </dd>
      </dl>
      <dl class="flex flex-col justify-between gap-2.5 text-sm sm:flex-row sm:gap-0">
        <dt class="text-gray-400">
          Data
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          {{ action.data }}
        </dd>
      </dl>
      <dl class="flex flex-col justify-between gap-2.5 text-sm sm:flex-row sm:items-center sm:gap-0">
        <dt class="text-gray-400">
          Operation
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          {{ action.operation }}
        </dd>
      </dl>
      <dl class="flex flex-col justify-between gap-2.5 text-sm sm:flex-row sm:items-center sm:gap-0">
        <dt class="text-gray-400">
          Value
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          {{ action.value }}
        </dd>
      </dl>
    </div>
  </details>
</template>

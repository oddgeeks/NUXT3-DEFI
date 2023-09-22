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
    <summary class="text-xs flex items-center justify-between cursor-pointer">
      <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center w-full">
        <dt class="text-slate-400">
          Target
        </dt>
        <dd class="flex justify-between items-center gap-2 break-all sm:w-[420px]">
          {{ action.target }}
          <SvgoChevronDown
            class="w-5 text-slate-400 group-open:rotate-180"
          />
        </dd>
      </dl>
    </summary>
    <div class="flex flex-col gap-2.5 mt-5">
      <div v-if="String(action.operation) === '1'" class="flex px-4 items-center py-2 mb-2.5 gap-2.5 justify-between text-sm border w-fit dark:border-slate-700 rounded-[14px]">
        <SvgoInfo2 class="text-slate-500" />
        This is a delegate call transaction
      </div>
      <dl v-if="decodedParams" class="flex sm:flex-row flex-col items-start justify-between text-sm sm:gap-0 gap-2.5">
        <dt style="word-break: break-all;" class="text-slate-400 max-w-[220px]">
          {{ decodedParams.method }}
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          <button class="text-primary" type="button" @click="openDecodedParamsModal(decodedParams)">
            View decoded params
          </button>
        </dd>
      </dl>
      <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5">
        <dt class="text-slate-400">
          Data
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          {{ action.data }}
        </dd>
      </dl>
      <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
        <dt class="text-slate-400">
          Operation
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          {{ action.operation }}
        </dd>
      </dl>
      <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
        <dt class="text-slate-400">
          Value
        </dt>
        <dd class="flex items-center gap-2 break-all sm:w-[420px]">
          {{ action.value }}
        </dd>
      </dl>
    </div>
  </details>
</template>

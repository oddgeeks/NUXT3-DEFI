<script lang="ts" setup>
import ClockCircleSVG from "~/assets/images/icons/clock-circle.svg?component";
import CheckCircleSVG from "~/assets/images/icons/check-circle.svg?component";

const router = useRoute();
const provider = getRpcProvider(75);

const [transaction] = (await Promise.all([
  provider
    .send("api_getTransactionByHash", [router.params.hash])
    .catch(() => null),
])) as [IAvocadoTransaction];
</script>

<template>
  <div class="container flex-1 md:pb-10">
    <h1 class="mb-5">Transaction Details</h1>

    <div
      v-if="transaction"
      class="dark:bg-gray-850 bg-slate-50 rounded-5.5 text-sm font-medium py-6.5"
    >
      <div class="flex flex-col gap-6.5 px-7.5">
        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">
            Transaction Hash
          </div>
          <div class="flex items-center space-x-2.5">
            <a
              :href="
                getExplorerUrl(transaction.chain_id, `/tx/${transaction.hash}`)
              "
              target="_blank"
              >{{ transaction.hash }}</a
            >
            <Copy :text="transaction.hash" />
          </div>
        </div>

        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">
            Broadcaster
          </div>
          <div class="flex items-center space-x-2.5">
            <a
              class="text-blue-500"
              :href="
                getExplorerUrl(
                  transaction.chain_id,
                  `/address/${transaction.from}`
                )
              "
              target="_blank"
            >
              {{ transaction.from }}
            </a>
            <Copy :text="transaction.from"></Copy>
          </div>
        </div>

        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">Status</div>
          <div
            class="capitalize text-sm flex items-center gap-2.5"
            :class="
              transaction.status === 'success'
                ? 'text-green-500'
                : 'text-yellow'
            "
          >
            <CheckCircleSVG
              class="text-white w-4 h-4 success-circle"
              v-if="transaction.status === 'success'"
            />
            <ClockCircleSVG v-else class="w-4 h-4" />

            {{ transaction.status }}

            <span v-if="transaction.status !== 'success'"
              >({{
                transaction.confirmations > 128
                  ? "128+"
                  : transaction.confirmations
              }}/128)</span
            >
          </div>
        </div>

        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">Timestamp</div>
          <div class="capitalize">
            {{ useTimeAgo(transaction.created_at).value }} ({{
              transaction.created_at
            }})
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150 mt-6.5" />

      <div class="px-7.5 py-6.5">
        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">Network</div>
          <div class="capitalize flex items-center">
            <ChainLogo class="w-5 h-5 mr-2.5" :chain="transaction.chain_id" />

            <span>{{ chainIdToName(transaction.chain_id) }}</span>
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150" />

      <div class="px-7.5 py-6.5 flex flex-col gap-6.5">
        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">Signer</div>

          <div
            v-if="transaction.metadata.signer"
            class="flex items-center space-x-2.5"
          >
            <a
              class="text-blue-500"
              :href="
                getExplorerUrl(
                  transaction.chain_id,
                  `/address/${transaction.metadata.signer}`
                )
              "
              target="_blank"
              >{{ transaction.metadata.signer }}</a
            >

            <Copy :text="transaction.metadata.signer" />
          </div>

          <div v-else class="capitalize">-</div>
        </div>

        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">AvoSafe</div>

          <div
            v-if="transaction.metadata.safe"
            class="flex items-center space-x-2.5"
          >
            <a
              class="text-blue-500"
              :href="
                getExplorerUrl(
                  transaction.chain_id,
                  `/address/${transaction.metadata.safe}`
                )
              "
              target="_blank"
              >{{ transaction.metadata.safe }}</a
            >

            <Copy :text="transaction.metadata.safe" />
          </div>

          <div v-else class="capitalize">-</div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150" />

      <div class="px-7.5 flex flex-col pt-6.5 gap-6.5">
        <div class="flex items-center">
          <div class="text-slate-400 md:w-full md:max-w-[200px]">
            Transaction Fee
          </div>
          <div class="capitalize">
            <span v-if="transaction.fee">
              {{ formatUsd(transaction.fee) }}
            </span>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="bg-gray-850 rounded-5.5 text-sm font-medium p-16 text-center"
    >
      <p class="mb-2">Sorry, We are unable to locate this TxnHash:</p>
      <p>{{ $route.params.hash }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";

const router = useRoute();
const provider = getRpcProvider(634);

const [transaction] = (await Promise.all([
  provider
    .send("api_getTransactionByHash", [router.params.hash])
    .catch(() => null),
])) as [IAvocadoTransaction];

const metadata = decodeMetadata(transaction.data);

onMounted(() =>
  console.log({
    metadata,
  })
);

const locale = computed(() =>
  typeof window !== "undefined" ? window.navigator.language : "en"
);

const isBridge =
  metadata?.length && metadata?.some((i: any) => i.type === "bridge");
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
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Transaction Hash
          </div>
          <div class="flex items-center space-x-2.5">
            <a
              class="text-primary"
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
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Broadcaster
          </div>
          <div class="flex items-center space-x-2.5">
            <a
              class="text-primary"
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
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Status
          </div>
          <TransactionStatus :status="transaction.status" />
        </div>

        <div class="flex items-center">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Timestamp
          </div>
          <div class="capitalize">
            {{ useTimeAgo(transaction.created_at).value }} ({{
              new Date(transaction.created_at).toLocaleString(locale)
            }})
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150 mt-6.5" />

      <div class="px-7.5 py-6.5">
        <div class="flex items-center">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Network
          </div>
          <div class="capitalize flex items-center">
            <ChainLogo class="w-5 h-5 mr-2.5" :chain="transaction.chain_id" />

            <span>{{ chainIdToName(transaction.chain_id) }}</span>
          </div>
        </div>
      </div>

      <div v-if="metadata">
        <hr class="w-full dark:border-slate-800 border-slate-150" />

        <div class="px-7.5 py-6.5">
          <div class="flex">
            <div
              class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
            >
              Transaction Action
            </div>
            <div class="flex items-center flex-col gap-6">
              <ActionMetadata
                :metadata="item"
                :key="i"
                :transaction="transaction"
                v-for="(item, i) of metadata"
              />
            </div>
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150" />

      <div class="px-7.5 py-6.5 flex flex-col gap-6.5">
        <div class="flex items-center">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Signer
          </div>

          <div
            v-if="transaction.metadata.signer"
            class="flex items-center space-x-2.5"
          >
            <a
              class="text-primary"
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
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Avocado Wallet
          </div>

          <div
            v-if="transaction.metadata.safe"
            class="flex items-center space-x-2.5"
          >
            <a
              class="text-primary"
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
          <div
            class="dark:text-slate-400 gap-2.5 flex items-center text-slate-500 md:w-full md:max-w-[235px]"
          >
            <SVGInfo
              v-tippy="
                'This includes the fee that will be paid to the relayer and the integrator.'
              "
              class="w-[18px] h-[18px] text-slate-600 shrink-0"
            />
            Transaction Fee
          </div>
          <div class="capitalize">
            <span v-if="transaction.fee">
              {{ formatUsd(transaction.fee) }}
            </span>
            <span v-else> - </span>
          </div>
        </div>
      </div>

      <div v-if="isBridge" class="flex flex-col pt-6.5 gap-6.5">
        <hr class="w-full dark:border-slate-800 border-slate-150" />

        <div class="flex items-center px-7.5">
          <div
            class="dark:text-slate-400 gap-2.5 flex items-center text-slate-500 md:w-full md:max-w-[235px]"
          >
            <SVGInfo
              v-tippy="
                'This is a token bridging transaction. Click on the link to check the estimated time for the transaction to be processed.'
              "
              class="w-[18px] h-[18px] text-slate-600 shrink-0"
            />

            Bridge Transaction
          </div>
          <div class="flex items-center gap-2.5">
            <a
              class="text-primary"
              :href="`https://socketscan.io/tx/${transaction.hash}`"
              target="_blank"
            >
              {{ transaction.hash }}
            </a>

            <Copy :text="transaction.hash" />
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

<template>
  <div>
    <div class="flex items-start justify-between">
      <div class="flex items-center">
        <button class="bg-green-500 p-[10px] rounded-full relative flex items-center justify-center mr-[14px]">
          <SvgoArrowRight />
        </button>
        <div>
          <h2 class="text-white text-lg font-semibold mb-1">Migrate</h2>
          <h3 class="text-slate-400 text-xs font-medium">Migrate to...</h3>
        </div>
      </div>
    </div>

    <div class="p-5 mt-[30px] border-[1px] bg-gray-850 border-slate-750 rounded-5">
      <h4 class="text-xs text-slate-400 font-medium mb-[10px]">Balances</h4>
      <div class="w-[460px] bg-gray-850 border-slate-750 rounded-5" :class="selectedTokensForMigration?.length ? 'border-[1px]' : ''">
        <MigrationTokenBalance
          v-for="token in selectedTokensForMigration"
          :key="token.address + '-' + token.chainId"
          :token-balance="(token as IBalance)"
          is-checked
          show-selected-ui
          @toggleCheck="() => toggleSelectedTokenForMigration(token)"
        />
        <div v-if="!selectedTokensForMigration?.length" class="text-xs text-slate-400 font-medium">No balances selected.</div>
      </div>

      <!-- <h4 class="text-xs text-slate-400 font-medium mb-[10px] mt-5">NFTs</h4>
      <div>
      </div>

      <h4 class="text-xs text-slate-400 font-medium mb-[10px] mt-5">DeFi Positions</h4>
      <div>
      </div> -->
    </div>

    <CommonButton
      class="mt-5 w-full"
      size="lg"
      :disabled="!selectedTokensForMigration?.length"
      :loading="loading"
      @click="migrate"
    >
      <div class="flex items-center justify-center w-full">
        <SvgoArrowRight class="rotate-90" />
        <span class="mx-[10px] text-sm text-white font-medium">Migrate</span>
        <SvgoArrowRight class="rotate-90" />
      </div>
    </CommonButton>

    <MigrationWalletItem class="mt-4" v-if="selectedSafe" primary :safe="selectedSafe" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Erc20__factory } from '~/contracts';
const { parseTransactionError } = useErrorHandler()

interface MigrateToModalProps {
  selectedSafe: ISafe | undefined
}

const { sendTransactions } = useAvocadoSafe()
const { toggleSelectedTokenForMigration } = useTokens()
const { selectedTokensForMigration } = storeToRefs(useTokens())
const { account, library } = useWeb3()

const props = defineProps<MigrateToModalProps>()
const loading = ref(false)

async function migrate() {
  loading.value = true;
  const transactions = [];
  const chainIds = [];
  try {

    for (let i = 0; i < selectedTokensForMigration.value.length; i++) {
      const selectedToken = selectedTokensForMigration.value[i];

      const txs = []

      const transferAmount = toBN((selectedToken as IBalance).balance)
        .times(10 ** selectedToken.decimals)
        .toFixed()

      if (selectedToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        txs.push({
          from: account.value,
          to: props.selectedSafe?.safe_address,
          value: transferAmount,
          data: '0x',
        })
      } else {
        const contract = Erc20__factory.connect(selectedToken.address, library.value)

        const { data: transferData } = await contract.populateTransaction.transfer(
          props.selectedSafe?.safe_address || '',
          transferAmount,
        )

        txs.push({
          from: account.value,
          to: selectedToken.address,
          value: '0',
          data: transferData,
        })
      }

      const metadata = encodeTransferMetadata(
        {
          token: selectedToken.address!,
          amount: toWei((selectedToken as IBalance).balance, selectedToken.decimals),
          receiver: props.selectedSafe?.safe_address || '',
        },
        true,
      )

      chainIds.push(Number(selectedToken.chainId));

      // logActionToSlack({
      //   message: `${formatDecimal(data.value.amount)} ${formatSymbol(
      //     token.value.symbol,
      //   )} to ${actualAddress.value}`,
      //   action: 'send',
      //   txHash: transactionHash,
      //   amountInUsd: amountInUsd.value.toFixed(),
      //   chainId: String(data.value.toChainId),
      //   account: account.value,
      // })
    }

    const hashes = await Promise.all(transactions)
    openPendingMigrationModal(hashes, chainIds)
  } catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    // logActionToSlack({
    //   message: err.formatted,
    //   action: 'send',
    //   type: 'error',
    //   account: account.value,
    //   errorDetails: err.parsed,
    // })
  } finally {
    loading.value = false
  }
}
</script>
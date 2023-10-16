<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ethers } from 'ethers'
import { Erc20__factory } from '~/contracts'

const props = defineProps<MigrateToModalProps>()

const emit = defineEmits(['destroy'])

const { parseTransactionError } = useErrorHandler()

interface MigrateToModalProps {
  selectedSafe: ISafe | undefined
}

interface MigrationTransaction {
  chainId: string | number
  txs: TransactionsAction[]
}

const { sendTransactions } = useAvocadoSafe()
const { legacySafeAddress } = storeToRefs(useSafe())
const {
  toggleSelectedTokenForMigration,
  toggleSelectedNFTsForMigration,
  setTokensForMigration,
  setNFTsForMigration,
} = useMigration()
const { selectedTokensForMigration, selectedNFTsForMigration, selectedSafeForMigration } = storeToRefs(useMigration())
const { account, library } = useWeb3()

const loading = ref(false)

function addNftTxs(currentTransactions: MigrationTransaction[]) {
  const transactions = [...currentTransactions]

  const erc712ABI = [
    'function transferFrom(address from, address to, uint256 tokenId)',
  ]

  const contractInterface = new ethers.utils.Interface(erc712ABI)

  for (let i = 0; i < selectedNFTsForMigration.value?.length; i++) {
    const nft = selectedNFTsForMigration.value[i]
    const calldata = contractInterface.encodeFunctionData('transferFrom', [legacySafeAddress.value, props.selectedSafe?.safe_address, nft.tokenId])

    const index = transactions.findIndex(tx => tx.chainId === nft.chainId)

    if (index === -1) {
      transactions.push({
        chainId: nft.chainId,
        txs: [{
          to: nft.contractAddress,
          data: calldata,
          operation: '0',
          value: '0',
        }],
      })
    }
    else {
      transactions[index].txs = [...transactions[index].txs, {
        to: nft.contractAddress,
        data: calldata,
        operation: '0',
        value: '0',
      }]
    }
  }

  return transactions
}

async function addGasBalanceTx(currentTransactions: MigrationTransaction[]) {
  if (!selectedSafeForMigration.value)
    return currentTransactions

  const transactions = [...currentTransactions]

  const gasBalanceManagerAddress = '0x847b123EB1Ed2f51bC8A5ed7D5C9091595793ae7'
  const gasBalanceManagerAbi = [{ inputs: [{ internalType: 'address', name: 'avoFactory_', type: 'address' }, { internalType: 'address', name: 'avoMultisigFactory_', type: 'address' }, { internalType: 'address', name: 'owner_', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' }, { inputs: [], name: 'AvoGasBalanceManager__InvalidParams', type: 'error' }, { inputs: [], name: 'AvoGasBalanceManager__Unauthorized', type: 'error' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'fromAvo', type: 'address' }, { indexed: true, internalType: 'address', name: 'toAvo', type: 'address' }, { indexed: false, internalType: 'address', name: 'toAvoOwner', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'toAvoIndex', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'AvoTransfer', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' }, { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }], name: 'OwnershipTransferred', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }], name: 'Paused', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }], name: 'Unpaused', type: 'event' }, { inputs: [], name: 'avoFactory', outputs: [{ internalType: 'contract IAvoFactory', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'avoMultisigFactory', outputs: [{ internalType: 'contract IAvoMultisigFactory', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'paused', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'toAvoOwner_', type: 'address' }, { internalType: 'uint256', name: 'toAvoIndex_', type: 'uint256' }, { internalType: 'uint256', name: 'amount_', type: 'uint256' }], name: 'transfer', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'toAvo_', type: 'address' }, { internalType: 'uint256', name: 'amount_', type: 'uint256' }], name: 'transfer', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' }]

  const signer = library.value.getSigner()

  const gasBalanceManagerInstance = new ethers.Contract(gasBalanceManagerAddress, gasBalanceManagerAbi, signer)

  const data = (await gasBalanceManagerInstance.populateTransaction['transfer(address,uint256,uint256)'](props.selectedSafe?.owner_address, props.selectedSafe?.multisig_index, toBN(selectedSafeForMigration.value.amount).toString())).data

  const tx = {
    to: gasBalanceManagerAddress,
    data,
    value: '0',
    operation: '0',
  }

  const index = transactions.findIndex(transaction => transaction.chainId === 137)
  if (index === -1) {
    return [...transactions, {
      chainId: 137,
      txs: [tx],
    }]
  }

  transactions[index].txs = [...transactions[index].txs, tx]

  return transactions
}

async function addBalancesTxs(currentTransactions: MigrationTransaction[]) {
  if (!props.selectedSafe?.safe_address)
    return currentTransactions

  const transactions = [...currentTransactions]

  for (let i = 0; i < selectedTokensForMigration.value.length; i++) {
    const selectedToken = selectedTokensForMigration.value[i]

    let tx

    const transferAmount = toBN((selectedToken as IBalance).balance)
      .times(10 ** selectedToken.decimals)
      .toFixed()

    if (selectedToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      tx = {
        from: account.value,
        to: props.selectedSafe?.safe_address,
        value: transferAmount,
        data: '0x',
      }
    }
    else {
      const contract = Erc20__factory.connect(selectedToken.address, library.value)

      const { data: transferData } = await contract.populateTransaction.transfer(
        props.selectedSafe?.safe_address,
        transferAmount,
      )

      tx = {
        from: account.value,
        to: selectedToken.address,
        value: '0',
        data: transferData || '',
      }
    }

    const index = transactions.findIndex((transaction: any) => transaction.chainId === selectedToken.chainId)
    if (index === -1) {
      transactions.push(
        {
          chainId: selectedToken.chainId,
          txs: [tx],
        },
      )
    }
    else {
      transactions[index] = {
        chainId: transactions[index].chainId,
        txs: [...transactions[index].txs, tx],
      }
    }
  }

  return transactions
}

async function migrate() {
  loading.value = true
  let transactions: MigrationTransaction[] = []

  transactions = await addBalancesTxs(transactions)
  transactions = addNftTxs(transactions)
  transactions = await addGasBalanceTx(transactions)

  try {
    const hashes = []
    const chainIds = []

    for (let i = 0; i < transactions.length; i++) {
      const hash = await sendTransactions(
        transactions[i].txs!,
        Number(transactions[i].chainId),
        {},
        'transfer',
      )

      hashes.push(hash)
      chainIds.push(transactions[i].chainId)
    }

    setTokensForMigration([])
    setNFTsForMigration([])
    emit('destroy')
    openPendingMigrationModal(hashes, chainIds)
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-start justify-between">
      <div class="flex items-center">
        <button class="relative mr-[14px] flex items-center justify-center rounded-full bg-green-500 p-[10px]">
          <SvgoArrowRight />
        </button>
        <div>
          <h2 class="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
            Migrate
          </h2>
          <h3 class="text-xs font-medium text-slate-400">
            Migrate to...
          </h3>
        </div>
      </div>
    </div>

    <div class="mt-[30px] rounded-5 border-[1px] border-white bg-slate-150 p-5 dark:border-slate-750 dark:bg-gray-850">
      <h4 class="mb-[10px] text-xs font-medium text-slate-900 dark:text-white">
        Balances
      </h4>
      <div class="w-[460px] max-w-full rounded-5 border-white bg-slate-150 dark:border-slate-750 dark:bg-gray-850" :class="selectedTokensForMigration?.length ? 'border-[1px]' : ''">
        <MigrationTokenBalance
          v-for="token in selectedTokensForMigration"
          :key="`${token.address}-${token.chainId}`"
          :token-balance="token as IBalance"
          show-selected-ui
          @toggle-check="() => toggleSelectedTokenForMigration(token)"
        />
        <div v-if="!selectedTokensForMigration?.length" class="text-xs font-medium text-slate-400">
          No balances selected.
        </div>
      </div>

      <h4 class="mb-[10px] mt-5 text-xs font-medium text-slate-900 dark:text-white">
        NFTs
      </h4>
      <div class="w-[460px] max-w-full rounded-5 border-white bg-slate-150 dark:border-slate-750 dark:bg-gray-850" :class="selectedNFTsForMigration?.length ? 'border-[1px]' : ''">
        <MigrationNFTCard
          v-for="asset in selectedNFTsForMigration"
          :key="`${asset.tokenId}-${asset.chainId}`"
          :asset="asset"
          show-selected-ui
          @toggleCheck="() => toggleSelectedNFTsForMigration(asset)"
        />
        <div v-if="!selectedNFTsForMigration?.length" class="text-xs font-medium text-slate-400">
          No NFTs selected.
        </div>
      </div>

      <!-- <h4 class="text-xs dark:text-white text-slate-900 font-medium mb-[10px] mt-5">
        DeFi Positions
      </h4>
      <div class="w-[460px] max-w-full dark:bg-gray-850 bg-slate-150 dark:border-slate-750 border-white rounded-5" :class="selectedDefiForMigration?.length ? 'border-[1px]' : ''">
        <MigrationDefiPosition
          v-for="position in selectedDefiForMigration"
          :key="position.id"
          :position="position"
          show-selected-ui
          @toggle-check="() => toggleSelectedDefiForMigration(position)"
        />
        <div v-if="!selectedDefiForMigration?.length" class="text-xs text-slate-400 font-medium">
          No DeFi positions selected.
        </div>
      </div> -->

      <h4 class="mb-[10px] mt-5 text-xs font-medium text-slate-900 dark:text-white">
        Gas balances
      </h4>
      <div v-if="selectedSafeForMigration" class="w-[460px] max-w-full rounded-5 border-1 border-white bg-slate-150 dark:border-slate-750 dark:bg-gray-850">
        <MigrationGasCard :safe="selectedSafeForMigration.safe" :balance="selectedSafeForMigration.amount" />
      </div>
      <div v-else class="text-xs font-medium text-slate-400">
        No Gas selected.
      </div>
    </div>

    <CommonButton
      class="mt-5 w-full"
      size="lg"
      :disabled="!selectedTokensForMigration?.length && !selectedNFTsForMigration?.length && !selectedSafeForMigration?.safe"
      :loading="loading"
      @click="migrate"
    >
      <div class="flex w-full items-center justify-center">
        <SvgoArrowRight class="rotate-90" />
        <span class="mx-[10px] text-sm font-medium text-white">Migrate</span>
        <SvgoArrowRight class="rotate-90" />
      </div>
    </CommonButton>

    <WalletItem v-if="selectedSafe" class="mt-4" v2 primary hide-active-state :safe="selectedSafe" />
  </div>
</template>

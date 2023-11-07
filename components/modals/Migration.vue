<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ethers } from 'ethers'
import groupBy from 'lodash/groupBy'
import flatMap from 'lodash/flatMap'
import { Erc20__factory } from '~/contracts'

const props = defineProps<MigrateToModalProps>()

const emit = defineEmits(['destroy'])

const { parseTransactionError } = useErrorHandler()

interface MigrateToModalProps {
  selectedMigrationSafe: ISafe | undefined
}

interface MigrationTransaction {
  chainId: string | number
  txs: TransactionsAction[]
  metadata: string[]
}

const { sendTransactions } = useAvocadoSafe()
const { selectedSafe } = storeToRefs(useSafe())
const {
  toggleSelectedTokenForMigration,
  toggleSelectedNFTsForMigration,
  setTokensForMigration,
  setNFTsForMigration,
} = useMigration()
const { selectedTokensForMigration, selectedNFTsForMigration, selectedSafeForMigration } = storeToRefs(useMigration())
const { account, library } = useWeb3()

const loading = ref(false)

function getNftTransactions() {
  const transactions: MigrationTransaction[] = []

  const erc712ABI = [
    'function transferFrom(address from, address to, uint256 tokenId)',
  ]

  const contractInterface = new ethers.utils.Interface(erc712ABI)

  for (let i = 0; i < selectedNFTsForMigration.value?.length; i++) {
    const nft = selectedNFTsForMigration.value[i]
    const calldata = contractInterface.encodeFunctionData('transferFrom', [selectedSafe.value?.safe_address, props.selectedMigrationSafe?.safe_address, nft.tokenId])

    transactions.push({
      chainId: nft.chainId,
      txs: [{
        to: nft.contractAddress,
        data: calldata,
        operation: '0',
        value: '0',
      }],
      metadata: [],
    })
  }

  return transactions
}

async function getGasBalanceTransactions() {
  if (!selectedSafeForMigration.value)
    return []

  const transactions: MigrationTransaction[] = []

  const gasBalanceManagerAddress = '0x847b123EB1Ed2f51bC8A5ed7D5C9091595793ae7'
  const gasBalanceManagerAbi = [{ inputs: [{ internalType: 'address', name: 'avoFactory_', type: 'address' }, { internalType: 'address', name: 'avoMultisigFactory_', type: 'address' }, { internalType: 'address', name: 'owner_', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' }, { inputs: [], name: 'AvoGasBalanceManager__InvalidParams', type: 'error' }, { inputs: [], name: 'AvoGasBalanceManager__Unauthorized', type: 'error' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'fromAvo', type: 'address' }, { indexed: true, internalType: 'address', name: 'toAvo', type: 'address' }, { indexed: false, internalType: 'address', name: 'toAvoOwner', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'toAvoIndex', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'AvoTransfer', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' }, { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }], name: 'OwnershipTransferred', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }], name: 'Paused', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }], name: 'Unpaused', type: 'event' }, { inputs: [], name: 'avoFactory', outputs: [{ internalType: 'contract IAvoFactory', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'avoMultisigFactory', outputs: [{ internalType: 'contract IAvoMultisigFactory', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'paused', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'toAvoOwner_', type: 'address' }, { internalType: 'uint256', name: 'toAvoIndex_', type: 'uint256' }, { internalType: 'uint256', name: 'amount_', type: 'uint256' }], name: 'transfer', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'toAvo_', type: 'address' }, { internalType: 'uint256', name: 'amount_', type: 'uint256' }], name: 'transfer', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' }]

  const signer = library.value.getSigner()

  const gasBalanceManagerInstance = new ethers.Contract(gasBalanceManagerAddress, gasBalanceManagerAbi, signer)

  const data = (await gasBalanceManagerInstance.populateTransaction['transfer(address,uint256,uint256)'](props.selectedMigrationSafe?.owner_address, props.selectedMigrationSafe?.multisig_index, toBN(selectedSafeForMigration.value.amount).toString())).data

  const tx = {
    to: gasBalanceManagerAddress,
    data,
    value: '0',
    operation: '0',
  }

  transactions.push({
    chainId: 137,
    metadata: [],
    txs: [tx],
  })

  return transactions
}

async function getBalanceTransactions() {
  if (!selectedTokensForMigration.value?.length)
    return []

  const transactions: MigrationTransaction[] = []

  for (let i = 0; i < selectedTokensForMigration.value.length; i++) {
    const selectedToken = selectedTokensForMigration.value[i]

    let tx

    const transferAmount = toBN((selectedToken as IBalance).balance)
      .times(10 ** selectedToken.decimals)
      .toFixed()

    const meta = encodeTransferMetadata(
      {
        token: selectedToken.address,
        amount: transferAmount,
        receiver: props.selectedMigrationSafe?.safe_address!,
      },
      false,
    )

    if (selectedToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      tx = {
        from: account.value,
        to: props.selectedMigrationSafe?.safe_address,
        value: transferAmount,
        data: '0x',
      }
    }
    else {
      const contract = Erc20__factory.connect(selectedToken.address, library.value)

      const { data: transferData } = await contract.populateTransaction.transfer(
        props.selectedMigrationSafe?.safe_address!,
        transferAmount,
      )

      tx = {
        from: account.value,
        to: selectedToken.address,
        value: '0',
        data: transferData || '',
      }
    }

    transactions.push({
      chainId: selectedToken.chainId,
      txs: [tx],
      metadata: [meta],
    })
  }

  return transactions
}

async function migrate() {
  loading.value = true

  const balanceTransactions = await getBalanceTransactions()
  const nftTransactions = getNftTransactions()
  const gasBalanceTransactions = await getGasBalanceTransactions()

  const groupedTransactions = groupBy([...balanceTransactions, ...nftTransactions, ...gasBalanceTransactions], 'chainId')
  const hashes: Record<string, string> = {}

  console.log(groupedTransactions)

  for (const chainId in groupedTransactions) {
    const transactions = flatMap(groupedTransactions[chainId], 'txs')
    const metadata = flatMap(groupedTransactions[chainId], 'metadata')

    const encodedMetadata = encodeMultipleActions(...metadata)

    try {
      const txHash = await sendTransactions(transactions,
        Number(chainId), { metadata: encodedMetadata }, 'transfer')

      if (txHash)
        hashes[chainId] = txHash
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

  setTokensForMigration([])
  setNFTsForMigration([])
  selectedSafeForMigration.value = undefined

  const succuessfulChainIds = Object.keys(hashes)
  const hashesArray = Object.values(hashes)

  if (!succuessfulChainIds.length || !hashesArray.length)
    return

  openPendingMigrationModal(hashesArray, succuessfulChainIds)
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
            Avocado Account Migration
          </h2>
          <h3 class="text-xs font-medium text-slate-400">
            Transferring Assets between Accounts
          </h3>
        </div>
      </div>
    </div>

    <div class="mt-[30px] rounded-5 border-[1px] border-white bg-slate-150 p-5 dark:border-slate-750 dark:bg-gray-850">
      <h4 class="mb-[10px] text-xs font-medium text-slate-900 dark:text-white">
        From
      </h4>
      <WalletItem v-if="selectedSafe" class="mt-4" v2 primary hide-active-state :safe="selectedSafe" />

      <h4 class="mb-[10px] mt-5 text-xs font-medium text-slate-900 dark:text-white">
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

    <WalletItem v-if="selectedMigrationSafe" class="mt-4" v2 primary hide-active-state :safe="selectedMigrationSafe" />
  </div>
</template>

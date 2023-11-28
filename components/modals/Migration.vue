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

const { sendTransactions } = useAvocadoSafe()
const { selectedSafe } = storeToRefs(useSafe())
const { switchToAvocadoNetwork } = useNetworks()

const { selectedTokensForMigration, selectedNFTsForMigration, selectedSafeForMigration } = storeToRefs(useMigration())
const { gasBalanceManagerAddress } = storeToRefs(useEnvironmentState())
const { account, library } = useWeb3()

const {
  toggleSelectedTokenForMigration,
  toggleSelectedNFTsForMigration,
  setTokensForMigration,
  setNFTsForMigration,
} = useMigration()

const loading = ref(false)

const availableToMigrate = computed(() => !!selectedTokensForMigration.value?.length
  || !!selectedNFTsForMigration.value.length
  || toBN(selectedSafeForMigration.value?.amount || '0').gt(0))

const multipleActions = asyncComputed<IEstimatedActions[]>(async () => {
  const arr: IEstimatedActions[] = []

  const resp = await Promise.all([
    getBalanceTransactions(),
    getNftTransactions(),
    getGasBalanceTransactions(),
  ])

  const groupedTransactions = groupBy(resp.flat(), 'chainId')

  for (const chainId in groupedTransactions) {
    const actions = flatMap(groupedTransactions[chainId], 'txs')
    const metadata = flatMap(groupedTransactions[chainId], 'metadata')

    const encodedMetadata = encodeMultipleActions(...metadata)

    arr.push({
      chainId: Number(chainId),
      actions,
      options: {
        metadata: encodedMetadata,
      },
    })
  }

  return arr
})

const { data: estimatedData, totalAmountAfterDiscount, pending: estimatePending, error: estimateError } = useMultipleEstimatedFee(multipleActions)

function getNftTransactions() {
  const transactions: IMigrationTransaction[] = []

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

  const transactions: IMigrationTransaction[] = []

  const gasBalanceManagerAbi = [{ inputs: [{ internalType: 'address', name: 'avoFactory_', type: 'address' }, { internalType: 'address', name: 'avoMultisigFactory_', type: 'address' }, { internalType: 'address', name: 'owner_', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' }, { inputs: [], name: 'AvoGasBalanceManager__InvalidParams', type: 'error' }, { inputs: [], name: 'AvoGasBalanceManager__Unauthorized', type: 'error' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'fromAvo', type: 'address' }, { indexed: true, internalType: 'address', name: 'toAvo', type: 'address' }, { indexed: false, internalType: 'address', name: 'toAvoOwner', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'toAvoIndex', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'AvoTransfer', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' }, { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }], name: 'OwnershipTransferred', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }], name: 'Paused', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }], name: 'Unpaused', type: 'event' }, { inputs: [], name: 'avoFactory', outputs: [{ internalType: 'contract IAvoFactory', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'avoMultisigFactory', outputs: [{ internalType: 'contract IAvoMultisigFactory', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'paused', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'toAvoOwner_', type: 'address' }, { internalType: 'uint256', name: 'toAvoIndex_', type: 'uint256' }, { internalType: 'uint256', name: 'amount_', type: 'uint256' }], name: 'transfer', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'toAvo_', type: 'address' }, { internalType: 'uint256', name: 'amount_', type: 'uint256' }], name: 'transfer', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' }]

  const signer = library.value.getSigner()

  const gasBalanceManagerInstance = new ethers.Contract(gasBalanceManagerAddress.value, gasBalanceManagerAbi, signer)

  const data = (await gasBalanceManagerInstance.populateTransaction['transfer(address,uint256,uint256)'](props.selectedMigrationSafe?.owner_address, props.selectedMigrationSafe?.multisig_index, selectedSafeForMigration.value.amount)).data

  const tx = {
    to: gasBalanceManagerAddress.value,
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

  const transactions: IMigrationTransaction[] = []

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
  try {
    loading.value = true
    const hashes = []

    await switchToAvocadoNetwork()

    for await (const action of multipleActions.value) {
      try {
        const hash = await sendTransactions(
          action.actions,
          action.chainId,
          action.options,
          'transfer',
        )

        if (hash) {
          addTransactionToQueue({
            hash,
            chainId: action.chainId,
          })
          hashes.push(hash)
        }
      }
      catch (e: any) {
        const err = parseTransactionError(e)

        openSnackbar({
          message: err.formatted,
          type: 'error',
        })
        continue
      }
    }

    if (hashes.length)
      logActions()

    selectedSafeForMigration.value = undefined

    setTokensForMigration([])
    setNFTsForMigration([])

    emit('destroy')
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

function logActions() {
  const totalAmountInUsdToken = selectedTokensForMigration.value
    .reduce<string>((acc, token) => toBN(acc).plus(token.balanceInUSD || 0).toFixed(), '0')

  const totalNftMigrated = selectedNFTsForMigration.value.length

  const totalGasBalanceMigrated = toBN(selectedSafeForMigration.value?.amount || 0)

  const formattedTokenMessage = toBN(totalAmountInUsdToken).gt(0) ? `${formatUsd(totalAmountInUsdToken)} worth of tokens migrated` : null
  const formattedNftMessage = totalNftMigrated ? `${totalNftMigrated} NFTs migrated` : null
  const formattedGasBalanceMessage = totalGasBalanceMigrated.gt(0) ? `${formatUsd(fromWei(totalGasBalanceMigrated, 6))} worth of gas balance migrated to ${selectedSafeForMigration.value?.safe?.safe_address}` : null

  const chains = estimatedData.value?.map(({ chainId }) => formatChainName(chainId)).join(', ')

  const formattedMessage = [
    chains,
    formattedTokenMessage,
    formattedNftMessage,
    formattedGasBalanceMessage,
  ].filter(Boolean).join('\n')

  logActionToSlack({
    type: 'success',
    account: account.value,
    action: 'migration',
    message: formattedMessage,
  })
}
</script>

<template>
  <div>
    <div class="mb-5 flex items-start justify-between">
      <div class="flex items-center">
        <button class="relative mr-[14px] flex items-center justify-center rounded-full bg-green-500 p-[10px]">
          <SvgoArrowRight />
        </button>
        <div>
          <h2 class="mb-1 text-lg font-semibold ">
            Migrate
          </h2>
          <h3 class="text-xs font-medium text-slate-400">
            Transferring Assets between Accounts.
          </h3>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-5">
        <h4 class="text-sm font-medium leading-5 ">
          Migrate From
        </h4>
        <WalletItem v-if="selectedSafe" detailed hide-active-state :safe="selectedSafe" />
      </div>

      <div class="flex flex-col gap-2">
        <h4 class="text-xs font-medium leading-5 text-slate-400">
          Balances
        </h4>
        <div class="max-w-full rounded-5 border  border-slate-750 bg-gray-850">
          <MigrationTokenBalance
            v-for="token in selectedTokensForMigration"
            :key="`${token.address}-${token.chainId}`"
            :token-balance="token as IBalance"
            show-selected-ui
            @toggle-check="() => toggleSelectedTokenForMigration(token)"
          />
          <p v-if="!selectedTokensForMigration?.length" class="px-4 py-[14px] text-sm text-slate-400">
            No token selected
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h4 class="text-xs font-medium leading-5 text-slate-400">
          NFTs
        </h4>
        <div class="max-w-full rounded-5 border border-slate-750 bg-gray-850">
          <MigrationNFTCard
            v-for="asset in selectedNFTsForMigration"
            :key="`${asset.tokenId}-${asset.chainId}`"
            :asset="asset"
            show-selected-ui
            @toggleCheck="() => toggleSelectedNFTsForMigration(asset)"
          />
          <p v-if="!selectedNFTsForMigration?.length" class="px-4 py-[14px] text-sm text-slate-400">
            No NFTs selected
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h4 class="text-xs font-medium text-slate-400">
          Gas balances
        </h4>
        <div class="max-w-full rounded-5 border-1 border-slate-750 bg-gray-850 px-4 py-[14px] text-sm text-slate-400">
          <MigrationGasCard v-if="selectedSafeForMigration" class="!p-0" :safe="selectedSafeForMigration.safe" :balance="selectedSafeForMigration.amount" />
          <p v-else>
            No Gas selected
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-5">
        <h4 class="text-sm font-medium leading-5 ">
          Migrate to
        </h4>
        <WalletItem v-if="selectedMigrationSafe" detailed hide-active-state :safe="selectedMigrationSafe" />
      </div>
    </div>

    <div v-if="estimatedData?.length && totalAmountAfterDiscount" class="mt-5">
      <MultipleEstimatedFee v-if="totalAmountAfterDiscount" :error="estimateError" :total-amount-after-discount="totalAmountAfterDiscount?.toFixed()" :data="estimatedData" />
    </div>

    <CommonButton
      class="mt-5 w-full justify-center"
      size="lg"
      :disabled="!availableToMigrate || !!estimateError"
      :loading="loading || estimatePending"
      @click="migrate"
    >
      Migrate
    </CommonButton>
  </div>
</template>

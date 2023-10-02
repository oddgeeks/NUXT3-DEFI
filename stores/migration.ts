import { defineStore } from 'pinia'

export const useMigration = defineStore('migration', () => {
  const selectedTokensForMigration = ref<IToken[]>([])
  const selectedNFTsForMigration = ref<NFTData[]>([])
  const selectedGasBalanceForMigration = ref<IGasBalanceMigration[]>([])
  const selectedDefiForMigration = ref<Positions[]>([])

  const toggleSelectedTokenForMigration = (tokenForMigration: IToken) => {
    const index = selectedTokensForMigration.value?.findIndex((selectedToken) => {
      return `${selectedToken.address}-${selectedToken.chainId}` === `${tokenForMigration.address}-${tokenForMigration.chainId}`
    })
    if (index === -1)
      selectedTokensForMigration.value.push(tokenForMigration)

    else
      selectedTokensForMigration.value.splice(index, 1)
  }

  const toggleSelectedNFTsForMigration = (NFTForMigration: NFTData) => {
    const index = selectedNFTsForMigration.value?.findIndex((selectedNFT) => {
      return `${selectedNFT.tokenId}-${selectedNFT.chainId}` === `${NFTForMigration.tokenId}-${NFTForMigration.chainId}`
    })
    if (index === -1)
      selectedNFTsForMigration.value.push(NFTForMigration)

    else
      selectedNFTsForMigration.value.splice(index, 1)
  }

  const toggleSelectedDefiForMigration = (defiForMigration: Positions) => {
    const index = selectedDefiForMigration.value?.findIndex((selectedDefi) => {
      return selectedDefi.id === defiForMigration.id
    })
    if (index === -1)
      selectedDefiForMigration.value.push(defiForMigration)

    else
      selectedDefiForMigration.value.splice(index, 1)
  }

  function isGasBalanceSelected(gasBalanceForMigration: IGasBalanceMigration) {
    const index = selectedGasBalanceForMigration.value.findIndex((selectedGasBalance) => {
      return gasBalanceForMigration.safe.safe_address === selectedGasBalance.safe.safe_address
    })

    return {
      index,
      isSelected: index !== -1,
    }
  }

  function toggleSelectedGasBalanceForMigration(gasBalanceForMigration: IGasBalanceMigration) {
    const index = isGasBalanceSelected(gasBalanceForMigration).index

    if (index === -1)
      selectedGasBalanceForMigration.value.push(gasBalanceForMigration)

    else
      selectedGasBalanceForMigration.value.splice(index, 1)
  }

  const setTokensForMigration = (tokensForMigration: IToken[]) => {
    selectedTokensForMigration.value = [...tokensForMigration]
  }

  const setNFTsForMigration = (NFTsForMigration: NFTData[]) => {
    selectedNFTsForMigration.value = [...NFTsForMigration]
  }

  const setDefiForMigration = (defiForMigration: Positions[]) => {
    selectedDefiForMigration.value = [...defiForMigration]
  }

  return {
    selectedTokensForMigration,
    toggleSelectedTokenForMigration,
    setTokensForMigration,
    selectedNFTsForMigration,
    toggleSelectedNFTsForMigration,
    setNFTsForMigration,
    selectedGasBalanceForMigration,
    toggleSelectedGasBalanceForMigration,
    isGasBalanceSelected,
    selectedDefiForMigration,
    toggleSelectedDefiForMigration,
    setDefiForMigration
  }
})

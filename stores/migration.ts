import { defineStore } from 'pinia'

export const useMigration = defineStore('migration', () => {
  const selectedTokensForMigration = ref<IBalance[]>([])
  const selectedNFTsForMigration = ref<NFTData[]>([])
  const selectedSafeForMigration = ref<IGasBalanceMigration>()
  const selectedDefiForMigration = ref<MigrationPositions[]>([])

  const toggleSelectedTokenForMigration = (tokenForMigration: IBalance) => {
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

  const toggleSelectedDefiForMigration = (defiForMigration: MigrationPositions) => {
    const index = selectedDefiForMigration.value?.findIndex((selectedDefi) => {
      return selectedDefi.id === defiForMigration.id
    })
    if (index === -1)
      selectedDefiForMigration.value.push(defiForMigration)

    else
      selectedDefiForMigration.value.splice(index, 1)
  }

  const setTokensForMigration = (tokensForMigration: IBalance[]) => {
    selectedTokensForMigration.value = [...tokensForMigration]
  }

  const setNFTsForMigration = (NFTsForMigration: NFTData[]) => {
    selectedNFTsForMigration.value = [...NFTsForMigration]
  }

  const setDefiForMigration = (defiForMigration: MigrationPositions[]) => {
    selectedDefiForMigration.value = [...defiForMigration]
  }

  return {
    selectedTokensForMigration,
    toggleSelectedTokenForMigration,
    setTokensForMigration,
    selectedNFTsForMigration,
    toggleSelectedNFTsForMigration,
    setNFTsForMigration,
    selectedDefiForMigration,
    toggleSelectedDefiForMigration,
    setDefiForMigration,
    selectedSafeForMigration,
  }
})

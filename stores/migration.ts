import { defineStore } from 'pinia'

export const useMigration = defineStore('migration', () => {
  const selectedTokensForMigration = ref<IToken[]>([])
  const selectedNFTsForMigration = ref<NFTData[]>([])

  const toggleSelectedTokenForMigration = (tokenForMigration: IToken) => {
    const index = selectedTokensForMigration.value?.findIndex((selectedToken) => {
      return `${selectedToken.address}-${selectedToken.chainId}` === `${tokenForMigration.address}-${tokenForMigration.chainId}`
    })
    if (index === -1) {
      selectedTokensForMigration.value.push(tokenForMigration)
    } else {
      selectedTokensForMigration.value.splice(index, 1)
    }
  }

  const toggleSelectedNFTsForMigration = (NFTForMigration: NFTData) => {
    const index = selectedNFTsForMigration.value?.findIndex((selectedNFT) => {
      return `${selectedNFT.tokenId}-${selectedNFT.chainId}` === `${NFTForMigration.tokenId}-${NFTForMigration.chainId}`
    })
    if (index === -1) {
      selectedNFTsForMigration.value.push(NFTForMigration)
    } else {
      selectedNFTsForMigration.value.splice(index, 1)
    }
  }

  const setTokensForMigration = (tokensForMigration: IToken[]) => {
    selectedTokensForMigration.value = [...tokensForMigration];
  }

  const setNFTsForMigration = (NFTsForMigration: NFTData[]) => {
    selectedNFTsForMigration.value = [...NFTsForMigration];
  }

  return {
    selectedTokensForMigration,
    toggleSelectedTokenForMigration,
    setTokensForMigration,
    selectedNFTsForMigration,
    toggleSelectedNFTsForMigration,
    setNFTsForMigration,
  }
})

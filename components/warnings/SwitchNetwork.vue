<script setup>
const { account, chainId } = useWeb3()
const { switchNetworkByChainId } = useNetworks()

</script>
<template>
   <div class="container mb-8" v-if="(account && chainId !== 75)">
     <div  class="bg-orange-500 gap-[15px] w-full justify-center flex bg-opacity-10 text-orange-500 rounded-5 p-4 text-sm text-center">
        <span class="text-xs self-center">
            It seems you're connected to wrong network. Please switch to Avocado Network or add the network on Metamask.
        </span>
        <CommonButton size="sm" @click="switchNetworkByChainId(75)">Switch Network</CommonButton>
    </div>
   </div>
</template>
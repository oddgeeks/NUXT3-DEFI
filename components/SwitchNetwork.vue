<script setup>

const { account, chainId } = useWeb3()
const { switchNetworkByChainId } = useNetworks()

</script>
<template>
    <div v-show="(account && chainId !== 420)" class="bg-orange-500 bg-opacity-10 text-orange-500 rounded-[20px] p-4 text-sm text-center">
        <span>
            It seems you're connected to wrong network. Please switch to Avocado Network or add the network on Metamask.
        </span>
        <button class="ml-4 bg-blue-500 hover:bg-blue-600 text-white rounded-[20px] px-4 py-2" @click="switchNetworkByChainId(420)">Switch Network</button>
    </div>
</template>
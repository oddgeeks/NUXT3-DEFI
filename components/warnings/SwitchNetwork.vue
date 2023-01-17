<script setup>
const { switchNetworkByChainId } = useNetworks()

</script>
<template>
     <div class="bg-orange-500 gap-[15px] w-full justify-center flex bg-opacity-10 text-orange-500 rounded-5 p-4 text-sm text-center">
        <span class="text-xs self-center">
            It seems you're connected to wrong network. Please switch to Avocado Network or add the network on Metamask.
        </span>
        <CommonButton class="h-7.5 !px-4 flex items-center text-xs" @click="switchNetworkByChainId(634)">Switch Network</CommonButton>
    </div>
</template>
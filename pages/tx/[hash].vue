<script setup>
const router = useRoute()
const provider = getRpcProvider(420)


const [avoInternalTransaction, tansaction, receipt] = await Promise.all([
    provider.send("api_getTransactionByHash", [
        router.params.hash
    ]),
    provider.getTransaction(router.params.hash),
    provider.getTransactionReceipt(router.params.hash),
])

</script>

<template>
    <div class="container">
        <pre class="overflow-scroll">{{ avoInternalTransaction }}</pre>

        <pre class="overflow-scroll">{{ tansaction }}</pre>
        
        <pre class="overflow-scroll">{{ receipt }}</pre>
    </div>
</template>
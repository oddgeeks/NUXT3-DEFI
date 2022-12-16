<script setup>
const router = useRoute()
const provider = getRpcProvider(420)


const [avoInternalTransaction, transaction, receipt] = await Promise.all([
    provider.send("api_getTransactionByHash", [
        router.params.hash
    ]),
    provider.getTransaction(router.params.hash),
    provider.getTransactionReceipt(router.params.hash),
])

</script>

<template>
    <div class="container space-y-8">
         <div class="bg-gray-850 rounded-[20px] p-6">
            <h2 class="font-bold text-lg mb-3">Avo Internal Transaction</h2>
            <pre class="overflow-scroll">{{ avoInternalTransaction }}</pre>
        </div>

         <div class="bg-gray-850 rounded-[20px] p-6">
            <h2 class="font-bold text-lg mb-3">Transaction</h2>
            <pre class="overflow-scroll">{{ transaction }}</pre>
        </div>


         <div class="bg-gray-850 rounded-[20px] p-6">
            <h2 class="font-bold text-lg mb-3">Receipt</h2>
            <pre class="overflow-scroll">{{ receipt }}</pre>
        </div>
    </div>
</template>
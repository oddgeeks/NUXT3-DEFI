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
    <div class="container space-y-8">
         <div class="bg-gray-850 rounded-[20px] p-6">
            <h2 class="font-bold text-lg mb-3">Avo Internal Tranasction</h2>
            <pre class="overflow-scroll">{{ avoInternalTransaction }}</pre>
        </div>

         <div class="bg-gray-850 rounded-[20px] p-6">
            <h2 class="font-bold text-lg mb-3">Tranasction</h2>
            <pre class="overflow-scroll">{{ tansaction }}</pre>
        </div>


         <div class="bg-gray-850 rounded-[20px] p-6">
            <h2 class="font-bold text-lg mb-3">Receipt</h2>
            <pre class="overflow-scroll">{{ receipt }}</pre>
        </div>
    </div>
</template>
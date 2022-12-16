<script setup>
const router = useRoute()
const provider = getRpcProvider(420)


const [avoInternalTransaction, transaction, _receipt] = await Promise.all([
    provider.send("api_getTransactionByHash", [
        router.params.hash
    ]),
    provider.getTransaction(router.params.hash),
    // provider.getTransactionReceipt(router.params.hash),
])

</script>

<template>
    <div class="container space-y-8">

        <h1 class="mb-5">Transaction Details</h1>

        <div class="bg-gray-850 rounded-5.5 text-sm font-medium">
            <div class="space-y-[26px] px-6.25 py-7.5">
                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Transaction Hash</div>
                    <div class="text-lg text-white">{{ transaction.hash }}</div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Broadcaster</div>
                    <div class="text-lg text-white">{{ transaction.from }}</div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Status</div>
                    <div class="text-lg text-white capitalize">{{ avoInternalTransaction.status }}</div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Timestamp</div>
                    <div class="text-lg text-white capitalize">{{ avoInternalTransaction.created_at }}</div>
                </div>
            </div>

            <div class="h-px w-full bg-slate-800" />

            <div class="space-y-[26px] px-6.25 py-7.5">
                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Network</div>
                    <div class="text-lg text-white capitalize flex items-center">
                        <ChainLogo class="w-5 h-5 mr-2.5" :chain="avoInternalTransaction.chain_id" />

                        <span>{{ chainIdToName(avoInternalTransaction.chain_id) }}</span>
                    </div>
                </div>
            </div>

            <div class="h-px w-full bg-slate-800 -py-6.5" />

            <div class="space-y-[26px] px-6.25 py-7.5">
                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Signer</div>
                    <div class="text-lg text-white capitalize">{{ avoInternalTransaction.metadata.signer || '-' }}</div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">AvoSafe</div>
                    <div class="text-lg text-white capitalize">{{ avoInternalTransaction.metadata.safe || '-' }}</div>
                </div>
            </div>

            <div class="h-px w-full bg-slate-800 -py-6.5" />

            <div class="space-y-[26px] px-6.25 py-7.5">

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Transaction Fee</div>
                    <div class="text-lg text-white capitalize"> - </div>
                </div>
            </div>

        </div>
    </div>
</template>
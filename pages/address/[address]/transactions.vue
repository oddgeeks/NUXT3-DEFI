<script setup lang="ts">
const router = useRoute()
const provider = getRpcProvider(420)

const transactions: { data: IAvocadoTransaction[], page: number, total: number } = await provider.send("api_getTransactionsByOwner", [
    router.params.address
])

</script>

<template>
    <div class="container">
        <h1 class="mb-5">Transactions for {{ $route.params.address }}</h1>

        <div class="bg-gray-850 rounded-[20px] overflow-hidden">
            <div class="overflow-y-auto max-h-[600px]">
                <table class="table w-full">
                    <tbody class="divide-y divide-slate-800">
                        <tr v-for="transaction in transactions.data">
                            <td class="px-6 py-4">
                                <NuxtLink :to="`/tx/${transaction.hash}`" class="text-blue-500">
                                    {{ shortenHash(transaction.hash, 8) }}
                                </NuxtLink>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-white capitalize flex items-center">
                                    <ChainLogo class="w-5 h-5 mr-2.5" :chain="transaction.chain_id" />

                                    <span>{{ chainIdToName(transaction.chain_id) }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4">{{ transaction.block_number }}</td>
                            <td class="px-6 py-4">{{ transaction.status }}</td>
                            <td class="px-6 py-4">{{ useTimeAgo(transaction.created_at).value }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</template>
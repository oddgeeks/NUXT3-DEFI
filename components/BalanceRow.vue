<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { IBalance } from "~/stores/safe"

const props = defineProps<{
    tokenBalance: IBalance
}>();

const priceDiff = computed(() => {
    if (!props.tokenBalance.sparklinePrice7d.length) return null;
    let a = props.tokenBalance.sparklinePrice7d.at(-24)!;
    let b = props.tokenBalance.sparklinePrice7d.at(-1)!;
    return 100 * (b - a) / a
})

const priceDiffClass = computed(() => {
    if (!priceDiff.value) return 'text-slate-400'

    if (priceDiff.value < 0) {
        return 'text-[#EB5757]'

    }

    return 'text-green-400'
})

const priceDiffColor = computed(() => {
    if (!priceDiff.value) return 'rgb(148 163 184)'

    if (priceDiff.value < 0) {
        return '#EB5757'

    }

    return 'rgb(74 222 128)';
})


const chartData = computed(() => ({
    labels: props.tokenBalance.sparklinePrice7d,
    datasets: [
        {
            data: props.tokenBalance.sparklinePrice7d,
            fill: false,
            pointRadius: 0,
            spanGaps: true,
            tension: 0.2
        }
    ],
}))

const chartOptions = {
    events: [],
    borderColor: priceDiffColor.value,
    borderWidth: 1.5,
    responsive: true,
    plugins: {
        legend: {
            display: false,
        },
        tooltips: {
            display: false
        }
    },
    scales: {
        x: {
            display: false,
        },
        y: {
            display: false,
        }
    },
}

</script>
<template>
    <tr>
        <td class="text-left px-8 py-6">
            <div class="flex items-center space-x-3">
                <div class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0">
                    <img :src="`https://cdn.instadapp.io/icons/tokens/${tokenBalance.symbol.toLowerCase()}.svg`"
                        onerror="this.onerror=null; this.remove();" />

                    <ChainLogo class="w-6 h-6 absolute -left-1 -bottom-1" :chain="tokenBalance.chainId" />
                </div>

                <div>
                    <div class="text-lg font-semibold"> {{ tokenBalance.name }}</div>
                    <div class="text-sm font-medium text-slate-400 max-w-[256px]">
                        {{ toBN(tokenBalance.balance).toFormat(6) }} {{ tokenBalance.symbol }}
                    </div>
                </div>
            </div>
        </td>
        <td class="text-center font-semibold px-8 py-6">
            $ {{ tokenBalance.balanceInUSD }}
        </td>
        <td class="text-center font-semibold px-8 py-6">
            <div class="w-20 h-8 mx-auto">
                <Line :data="chartData" :options="chartOptions"
                    :key="JSON.stringify({ ...chartData, ...chartOptions })" />
            </div>
        </td>

        <td class="text-center font-semibold px-8 py-6">
            <span v-if="priceDiff" :class="priceDiffClass">
                {{ priceDiff.toFixed(2) }}%
            </span>

            <span v-else>
                -
            </span>
        </td>

        <td class="text-right px-8 py-6">
            <div class="flex items-center space-x-3">

                <button @click="openSendModal(tokenBalance.address, tokenBalance.chainId)"
                    :disabled="isZero(tokenBalance.balance)" class="
                        py-2
                        px-7
                        inline-flex
                        justify-center
                        items-center
                        rounded-[20px]
                        bg-blue-500
                        disabled:bg-slate-800
                        disabled:text-slate-500 
                        hover:bg-blue-600
                        text-sm
                        font-semibold
                    ">
                    Send
                </button>

                <button @click="openBridgeModal(tokenBalance.address, tokenBalance.chainId)"
                    :disabled="isZero(tokenBalance.balance)" class="
                        py-2
                        px-7
                        inline-flex
                        justify-center
                        items-center
                        rounded-[20px]
                        bg-blue-500
                        disabled:bg-slate-800
                        disabled:text-slate-500 
                        hover:bg-blue-600
                        text-sm
                        font-semibold
                    ">
                    Bridge
                </button>
            </div>
        </td>
    </tr>

</template>
<script setup>
import QrcodeVue from "qrcode.vue";
const { safeAddress } = useAvocadoSafe();
const { copy, copied } = useClipboard();
const account = computed(() => safeAddress.value || "0x000000000000000")

const shortenAddress = () => {
    return account.value.substr(0, 6) + "..." + account.value.substr(-4);
};
</script>
<template>
    <div>
        <h2 class="font-semibold mb-5">QR to Receive</h2>

        <div :class="{ 'blur': !safeAddress }"
            class="bg-gray-850 rounded-[20px] py-8 px-6 flex flex-col justify-center items-center">
            <!-- <QrcodeVue :size="140" :margin="5" level="M" :value="account" foreground="#052740"
                class="rounded-[20px] mx-auto" /> -->

            <StyledQrCode class="rounded-[20px] mx-auto bg-white overflow-hidden" :data="account" :key="account" />

            <div v-if="!copied" class="text-slate-400 font-semibold inline-flex items-center gap-1 cursor-pointer mt-5"
                @click="copy(account)">
                <span>{{ shortenAddress() }}</span>

                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_2790_3105)">
                        <path
                            d="M12.385 15.0216C12.4712 13.6454 12.5165 12.2195 12.5165 10.7584C12.5165 10.1665 12.509 9.58029 12.4945 9.00086C12.4841 8.59079 12.3512 8.19227 12.1084 7.86163C11.1899 6.61069 10.4575 5.83209 9.25194 4.90136C8.91819 4.64368 8.50856 4.50392 8.08703 4.49473C7.66769 4.4856 7.2298 4.48096 6.76214 4.48096C5.34624 4.48096 4.20335 4.52349 3.02159 4.60454C2.00789 4.67407 1.20278 5.48111 1.13928 6.49522C1.0531 7.87141 1.00781 9.29735 1.00781 10.7584C1.00781 12.2195 1.0531 13.6454 1.13928 15.0216C1.20278 16.0357 2.00789 16.8427 3.02159 16.9123C4.20335 16.9933 5.34624 17.0358 6.76214 17.0358C8.17804 17.0358 9.32093 16.9933 10.5027 16.9123C11.5164 16.8427 12.3215 16.0357 12.385 15.0216Z"
                            fill="#111827" stroke="#94A3B8" stroke-width="2" />
                        <path
                            d="M16.8605 11.505C16.9468 10.1288 16.9921 8.70285 16.9921 7.2418C16.9921 6.64987 16.9846 6.0637 16.9701 5.48427C16.9598 5.07419 16.8267 4.67567 16.584 4.34503C15.6655 3.09409 14.933 2.31549 13.7275 1.38476C13.3937 1.12708 12.9841 0.987316 12.5626 0.978132C12.1433 0.968996 11.7054 0.964355 11.2377 0.964355C9.82182 0.964355 8.67894 1.00689 7.49719 1.08795C6.48348 1.15748 5.67836 1.96451 5.61486 2.97862C5.52868 4.35481 5.4834 5.78074 5.4834 7.2418C5.4834 8.70285 5.52869 10.1288 5.61486 11.505C5.67836 12.5191 6.48348 13.3261 7.49719 13.3957C8.67894 13.4767 9.82182 13.5192 11.2377 13.5192C12.6536 13.5192 13.7965 13.4767 14.9782 13.3957C15.992 13.3261 16.7971 12.5191 16.8605 11.505Z"
                            fill="#111827" stroke="#94A3B8" stroke-width="2" />
                    </g>
                    <defs>
                        <clipPath id="clip0_2790_3105">
                            <rect width="18" height="18" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            </div>

            <div class="text-slate-400 font-semibold inline-flex items-center gap-1 cursor-pointer mt-5" v-else>
                <span> Copied </span>

                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" width="16" height="16" rx="8" fill="#94A3B8" />
                    <g clip-path="url(#clip0_2949_8772)">
                        <path d="M11.1663 6L7.49967 9.66667L5.83301 8" stroke="#0F172A" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <defs>
                        <clipPath id="clip0_2949_8772">
                            <rect width="8" height="8" fill="white" transform="translate(4.5 4)" />
                        </clipPath>
                    </defs>
                </svg>

            </div>

            <p v-if="safeAddress" class="mt-4 text-green-400 text-xs font-semibold text-center leading-5">
                Deposit any tokens on Ethereum, Polygon, Arbitrum, Optimism and Avalanche.
            </p>

        </div>
    </div>
</template>
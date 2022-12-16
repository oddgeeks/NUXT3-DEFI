<script setup>
import CopySVG from "~/assets/images/icons/copy.svg?component";
import ClockCircleSVG from "~/assets/images/icons/clock-circle.svg?component";

const router = useRoute()
const provider = getRpcProvider(420)

const { copy: copyTxHash, copied: txHashCopied } = useClipboard();
const { copy: copyBroadcaster, copied: broadcasterCopied } = useClipboard();
const { copy: copySigner, copied: signerCopied } = useClipboard();
const { copy: copySafe, copied: safeCopied } = useClipboard();

const [transaction] = await Promise.all([
    provider.send("api_getTransactionByHash", [
        router.params.hash
    ]).catch(() => null),
])

</script>

<template>
    <div class="container space-y-8">

        <h1 class="mb-5">Transaction Details</h1>

        <div v-if="transaction" class="bg-gray-850 rounded-5.5 text-sm font-medium">
            <div class="space-y-[26px] px-6.25 py-7.5">
                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Transaction Hash</div>
                    <div class="text-white flex items-center space-x-2.5">
                        <a :href="getExplorerUrl(transaction.chain_id, `/tx/${transaction.hash}`)" target="_blank">{{
                                transaction.hash
                        }}</a>

                        <div class="inline-flex items-center gap-1 text-xs" v-if="txHashCopied">

                            <span> Copied </span>

                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
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

                        <button v-else @click="copyTxHash(transaction.hash)">
                            <CopySVG />
                        </button>
                    </div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Broadcaster</div>
                    <div class="text-white flex items-center space-x-2.5">
                        <a class="text-blue-500"
                            :href="getExplorerUrl(transaction.chain_id, `/address/${transaction.from}`)"
                            target="_blank">{{ transaction.from }}</a>

                        <div class="inline-flex items-center gap-1 text-xs" v-if="broadcasterCopied">

                            <span> Copied </span>

                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
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

                        <button v-else @click="copyBroadcaster(transaction.from)">
                            <CopySVG />
                        </button>
                    </div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Status</div>
                    <div class="capitalize text-yellow text-sm flex items-center space-x-2.5">
                        <ClockCircleSVG class="w-[18px] h-[18px]" />

                        <span>{{ transaction.status }}</span>
                    </div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Timestamp</div>
                    <div class="text-white capitalize">{{ useTimeAgo(transaction.created_at).value }} ({{ transaction.created_at }})</div>
                </div>
            </div>

            <div class="h-px w-full bg-slate-800" />

            <div class="space-y-[26px] px-6.25 py-7.5">
                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Network</div>
                    <div class="text-white capitalize flex items-center">
                        <ChainLogo class="w-5 h-5 mr-2.5" :chain="transaction.chain_id" />

                        <span>{{ chainIdToName(transaction.chain_id) }}</span>
                    </div>
                </div>
            </div>

            <div class="h-px w-full bg-slate-800 -py-6.5" />

            <div class="space-y-[26px] px-6.25 py-7.5">
                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Signer</div>

                    <div v-if="transaction.metadata.signer" class="text-white flex items-center space-x-2.5">

                        <a class="text-blue-500"
                            :href="getExplorerUrl(transaction.chain_id, `/address/${transaction.metadata.signer}`)"
                            target="_blank">{{ transaction.metadata.signer }}</a>

                        <div class="inline-flex items-center gap-1 text-xs" v-if="signerCopied">

                            <span> Copied </span>

                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
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

                        <button v-else @click="copySigner(transaction.metadata.signer)">
                            <CopySVG />
                        </button>
                    </div>

                    <div v-else class="text-white capitalize"> - </div>
                </div>

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">AvoSafe</div>

                    <div v-if="transaction.metadata.safe" class="text-white flex items-center space-x-2.5">
                        <a class="text-blue-500"
                            :href="getExplorerUrl(transaction.chain_id, `/address/${transaction.metadata.safe}`)"
                            target="_blank">{{ transaction.metadata.safe }}</a>

                        <div class="inline-flex items-center gap-1 text-xs" v-if="safeCopied">

                            <span> Copied </span>

                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
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

                        <button v-else @click="copySafe(transaction.metadata.safe)">
                            <CopySVG />
                        </button>
                    </div>

                    <div v-else class="text-white capitalize"> - </div>
                </div>
            </div>

            <div class="h-px w-full bg-slate-800 -py-6.5" />

            <div class="space-y-[26px] px-6.25 py-7.5">

                <div class="flex items-center">
                    <div class="text-slate-400 md:w-full md:max-w-[200px]">Transaction Fee</div>
                    <div class="text-white capitalize"> - </div>
                </div>
            </div>

        </div>

        <div v-else class="bg-gray-850 rounded-5.5 text-sm font-medium p-16 text-center">
            <p class="mb-2"> Sorry, We are unable to locate this TxnHash:</p>
            <p>{{ $route.params.hash }}</p>
        </div>
    </div>
</template>
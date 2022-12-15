<script setup>

const { tokenBalances, safeAddress } = useAvocadoSafe();
const { account } = useWeb3();
</script>
<template>
  <div>
    <h2 class="font-semibold mb-5">Balances</h2>

    <div class="relative">
      <div class="bg-gray-850 rounded-[20px] overflow-hidden">
        <div
          class="overflow-y-auto max-h-[600px]"
          :class="{ blur: tokenBalances.length === 0 }"
        >
          <table class="table w-full">
            <tbody class="divide-y divide-slate-800">
              <template v-if="tokenBalances.length > 0">
                <BalanceRow
                  v-for="tokenBalance in tokenBalances"
                  :token-balance="tokenBalance"
                />
              </template>

              <template v-else>
                <tr v-for="i in 8">
                  <td class="px-8 py-6">
                    <div class="flex space-x-3">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="40" height="40" rx="20" fill="#1E293B" />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M20.0007 10C14.4774 10 10 14.4774 10 20.0007C10 25.5239 14.4774 30.0013 20.0007 30.0013C25.5239 30.0013 30.0013 25.5239 30.0013 20.0007C30.0013 17.3483 28.9477 14.8046 27.0722 12.9291C25.1967 11.0536 22.653 10 20.0007 10ZM20.0023 28.001C15.5838 28.001 12.0018 24.4191 12.0018 20.0005C12.0018 15.582 15.5838 12 20.0023 12C24.4209 12 28.0029 15.582 28.0029 20.0005C28.0029 22.1224 27.16 24.1574 25.6596 25.6577C24.1592 27.1581 22.1242 28.001 20.0023 28.001ZM13.9986 19.4508C14.2555 16.5462 16.5634 14.2467 19.469 14.0005C19.6121 13.9916 19.7521 14.0446 19.8535 14.146C19.9549 14.2474 20.0079 14.3874 19.999 14.5305V15.5306C19.9903 15.7751 19.8024 15.9758 19.559 16.0006C17.6805 16.198 16.1962 17.6824 15.9987 19.5608C15.9727 19.8157 15.7548 20.0074 15.4987 20.0009H14.4986C14.3588 19.9994 14.2254 19.9418 14.1286 19.8409C14.0374 19.732 13.9909 19.5926 13.9986 19.4508Z"
                          fill="#334155"
                        />
                      </svg>

                      <div class="space-y-1">
                        <div class="bg-slate-800 rounded-[20px] w-20 h-5"></div>

                        <div class="bg-slate-800 rounded-[20px] w-36 h-5"></div>
                      </div>
                    </div>
                  </td>
                  <td class="border-b border-slate-800 px-8 py-6">
                    <div class="bg-slate-800 rounded-[20px] w-32 h-5"></div>
                  </td>
                  <td class="border-b border-slate-800 px-8 py-6">
                    <div class="bg-slate-800 rounded-[20px] w-20 h-5"></div>
                  </td>
                  <td class="border-b border-slate-800 px-8 py-6">
                    <div class="bg-slate-800 rounded-[20px] w-16 h-5"></div>
                  </td>
                  <td class="border-b border-slate-800 px-8 py-6">
                    <div class="bg-slate-800 rounded-[20px] w-24 h-9"></div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="!account"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="flex flex-col items-center justify-center gap-6">
          <p class="font-semibold text-lg">
            Connect your wallet to see the balances
          </p>

          <div class="w-28">
            <Web3Button button-only />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

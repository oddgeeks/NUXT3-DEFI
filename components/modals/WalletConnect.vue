<script setup lang="ts">
const wcStore = useWalletConnect()

const uri = ref()
const connection = shallowRef()
const connectionChainId = shallowRef(137)

const prepareAndConnect = async () => {
  connection.value = await wcStore.prepareConnection(uri.value);
  connectionChainId.value = connection.value.chainId;
  uri.value = null
}

const connect = async () => {
  await wcStore.connect(connection.value.connector, connection.value.storageId, connectionChainId.value);

  uri.value = null
  connection.value = undefined
}
</script>

<template>
  <CommonModal ref="modal" containerClass="rounded-[20px] md:max-w-md">
    <template #reveal="{ openModal }">
      <slot :openModal="openModal">
        <button @click="openModal" class="text-blue-500 hover:text-blue-600 font-medium">Connect to dApps</button>
      </slot>
    </template>
    <template v-slot="{ closeModal }">
      <div v-if="!connection" class="bg-[#111827] rounded-[20px] p-8 space-y-8 text-center">
        <div class="inline-flex items-center space-x-3">
          <svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M11.5 0C17.5758 0 22.5 4.92422 22.5 11C22.5 17.0758 17.5758 22 11.5 22C5.42422 22 0.5 17.0758 0.5 11C0.5 4.92422 5.42422 0 11.5 0Z"
              fill="url(#paint0_radial_2825_4573)" />
            <path
              d="M7.49121 8.49502C9.7041 6.33369 13.2963 6.33369 15.5092 8.49502L15.7756 8.75713C15.8873 8.86455 15.8873 9.04072 15.7756 9.14814L14.8646 10.0376C14.8088 10.0935 14.7186 10.0935 14.6627 10.0376L14.2975 9.68096C12.7506 8.17275 10.2498 8.17275 8.70293 9.68096L8.31191 10.0634C8.25605 10.1192 8.16582 10.1192 8.10996 10.0634L7.19902 9.17393C7.0873 9.0665 7.0873 8.89033 7.19902 8.78291L7.49121 8.49502ZM17.3955 10.3341L18.2076 11.1247C18.3193 11.2321 18.3193 11.4083 18.2076 11.5157L14.551 15.0864C14.4393 15.1938 14.2588 15.1938 14.1514 15.0864L11.5561 12.5513C11.5303 12.5255 11.483 12.5255 11.4572 12.5513L8.86191 15.0864C8.7502 15.1938 8.56973 15.1938 8.4623 15.0864L4.79277 11.5157C4.68105 11.4083 4.68105 11.2321 4.79277 11.1247L5.60488 10.3341C5.7166 10.2267 5.89707 10.2267 6.00449 10.3341L8.5998 12.8692C8.62559 12.895 8.67285 12.895 8.69863 12.8692L11.2939 10.3341C11.4057 10.2267 11.5861 10.2267 11.6936 10.3341L14.2889 12.8692C14.3146 12.895 14.3619 12.895 14.3877 12.8692L16.983 10.3341C17.1033 10.2267 17.2838 10.2267 17.3955 10.3341Z"
              fill="white" />
            <defs>
              <radialGradient id="paint0_radial_2825_4573" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                gradientTransform="translate(0.500068 11.0003) scale(22)">
                <stop stop-color="#5D9DF6" />
                <stop offset="1" stop-color="#006FFF" />
              </radialGradient>
            </defs>
          </svg>


          <span>
            WalletConnect
          </span>

        </div>

        <p class="text-slate-400 text-xs text-center">You need the WalletConnect app to be open to popup transactions.
          You will not receive transaction requests when it is not open.</p>

        <div class="bg-gray-850 rounded-[20px] divide-y divide-slate-800" v-if="wcStore.sessions.length">
          <template v-for="session in wcStore.sessions">
            <div v-if="session.peerMeta" class="flex items-center gap-3 p-5">
              <div class="relative inline-block h-9 w-9 rounded-full bg-gray-300 shadow-sm flex-shrink-0">
                <img v-if="session.peerMeta.icons.length" class="w-full h-full object-fit"
                  :src="session.peerMeta.icons[session.peerMeta.icons.length - 1]" />

                <ChainLogo class="w-5 h-5 absolute -left-1 -bottom-1" :chain="String(session.chainId)" />
              </div>

              <div class="flex-1 text-left">
                <div>{{ session.peerMeta.name }}</div>
                <div class="text-sm" :class="{ 'text-green-400': session.connected }">{{ session.connected ? 'Connected'
                    :
                    'Connect'
                }}</div>
              </div>

              <div class="flex items-center space-x-5">
                <a v-tippy="'Open in new link'" :href="session.peerMeta.url" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3.83279 16.1182L1.8826 14.168C0.983075 13.2684 0.868512 11.8494 1.61209 10.8172C2.1678 10.0458 2.84691 9.37134 3.62209 8.82093L4.0472 8.51909C4.84263 7.9543 5.92948 8.0458 6.6193 8.73561L6.6743 8.79062L9.241 11.3573L9.26515 11.3815C9.95496 12.0713 10.0465 13.1581 9.48167 13.9536L9.17983 14.3787C8.62942 15.1539 7.95494 15.833 7.18355 16.3887C6.15138 17.1322 4.73232 17.0177 3.83279 16.1182Z"
                      stroke="#4E80EE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path
                      d="M16.1182 3.83206L14.168 1.88187C13.2684 0.982343 11.8494 0.867779 10.8172 1.61136C10.0458 2.16706 9.37134 2.84618 8.82093 3.62136L8.51909 4.04647C7.9543 4.8419 8.0458 5.92875 8.73561 6.61857L8.79061 6.67357L11.3573 9.24027L11.3815 9.26441C12.0713 9.95423 13.1581 10.0457 13.9536 9.48094L14.3787 9.17909C15.1539 8.62869 15.833 7.95421 16.3887 7.18282C17.1322 6.15065 17.0177 4.73158 16.1182 3.83206Z"
                      stroke="#4E80EE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M11.393 6.60645L6.61719 11.3823" stroke="#4E80EE" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>
                </a>


                <button @click="wcStore.disconnect(session)">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6.75 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H6.75"
                      stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M12 12.75L15.75 9L12 5.25" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                    <path d="M15.75 9H6.75" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>

                </button>
              </div>
            </div>
          </template>
        </div>

        <input type="text"
          class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full"
          placeholder="QR code or link" v-model="uri" />

        <button class="bg-blue-500 hover:bg-blue-600 rounded-[15px] w-full h-12"
          @click="prepareAndConnect">Connect</button>
      </div>

      <div v-else class="bg-[#111827] rounded-[20px] p-8 space-y-8 text-center">
        <div class="flex flex-col items-center space-y-8">
          <div class="w-10 h-10" v-if="connection.peerMeta.icons.length">
            <img class="w-full h-full object-fit"
              :src="connection.peerMeta.icons[connection.peerMeta.icons.length - 1]" />
          </div>

          <span>
            {{ connection.peerMeta.name }} Wants to Connect
          </span>

        </div>

        <p class="text-slate-400 text-xs text-center">You need the WalletConnect app to be open to popup transactions.
          You will not receive transaction requests when it is not open.</p>

        <div class="text-blue-500 text-sm">
          {{ connection.peerMeta.url }}
        </div>

        <select v-model="connectionChainId"
          class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full">
          <option :value="137">Polygon</option>
          <option :value="1">Mainnet</option>
          <option :value="10">Optimism</option>
          <option :value="250">Fantom</option>
          <option :value="43114">Avalanche</option>
          <option :value="42161">Arbitrum</option>
        </select>

        <button class="bg-blue-500 hover:bg-blue-600 rounded-[15px] w-full h-12" @click="connect">Connect</button>
      </div>
    </template>
  </CommonModal>
</template>

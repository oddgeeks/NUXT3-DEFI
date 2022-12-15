<script setup lang="ts">
const wcStore = useWalletConnect();

const uri = ref();
const connection = shallowRef();
const connectionChainId = shallowRef(137);

const prepareAndConnect = async () => {
  if (!uri.value) {
    return;
  }
  connection.value = await wcStore.prepareConnection(uri.value);
  connectionChainId.value = connection.value.chainId;
  uri.value = null;
};

const connect = async () => {
  await wcStore.connect(
    connection.value.connector,
    connection.value.storageId,
    connectionChainId.value
  );

  uri.value = null;
  connection.value = undefined;
};
</script>

<template>
  <div v-if="!connection" class="space-y-8">
    <div class="inline-flex flex-col items-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M20 0C31.0469 0 40 8.95312 40 20C40 31.0469 31.0469 40 20 40C8.95312 40 0 31.0469 0 20C0 8.95312 8.95312 0 20 0Z"
          fill="url(#paint0_radial_2802_2420)"
        />
        <path
          d="M12.7109 15.4453C16.7344 11.5156 23.2656 11.5156 27.2891 15.4453L27.7734 15.9219C27.9766 16.1172 27.9766 16.4375 27.7734 16.6328L26.1172 18.25C26.0156 18.3516 25.8516 18.3516 25.75 18.25L25.0859 17.6016C22.2734 14.8594 17.7266 14.8594 14.9141 17.6016L14.2031 18.2969C14.1016 18.3984 13.9375 18.3984 13.8359 18.2969L12.1797 16.6797C11.9766 16.4844 11.9766 16.1641 12.1797 15.9687L12.7109 15.4453ZM30.7188 18.7891L32.1953 20.2266C32.3984 20.4219 32.3984 20.7422 32.1953 20.9375L25.5469 27.4297C25.3438 27.625 25.0156 27.625 24.8203 27.4297L20.1016 22.8203C20.0547 22.7734 19.9688 22.7734 19.9219 22.8203L15.2031 27.4297C15 27.625 14.6719 27.625 14.4766 27.4297L7.80469 20.9375C7.60156 20.7422 7.60156 20.4219 7.80469 20.2266L9.28125 18.7891C9.48437 18.5938 9.8125 18.5938 10.0078 18.7891L14.7266 23.3984C14.7734 23.4453 14.8594 23.4453 14.9062 23.3984L19.625 18.7891C19.8281 18.5938 20.1562 18.5938 20.3516 18.7891L25.0703 23.3984C25.1172 23.4453 25.2031 23.4453 25.25 23.3984L29.9688 18.7891C30.1875 18.5938 30.5156 18.5938 30.7188 18.7891Z"
          fill="white"
        />
        <defs>
          <radialGradient
            id="paint0_radial_2802_2420"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(0.000123978 20.0006) scale(40)"
          >
            <stop stop-color="#5D9DF6" />
            <stop offset="1" stop-color="#006FFF" />
          </radialGradient>
        </defs>
      </svg>

      <div class="text-lg mt-8 mb-4">WalletConnect</div>

      <p class="text-slate-400 text-xs text-center leading-5">
        You need the Avocado web app to be open to popup transactions. You will
        not receive transaction requests when it is not open. Please don't close
        the tab.
      </p>
    </div>

    <div
      class="bg-gray-850 rounded-[20px] divide-y divide-slate-800"
      v-if="wcStore.sessions.length"
    >
      <template v-for="session in wcStore.sessions">
        <div v-if="session.peerMeta" class="flex items-center gap-3 p-5">
          <div
            class="relative inline-block h-9 w-9 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
          >
            <img
              v-if="session.peerMeta.icons.length"
              class="w-full h-full object-fit"
              :src="session.peerMeta.icons[session.peerMeta.icons.length - 1]"
            />

            <ChainLogo
              class="w-5 h-5 absolute -left-1 -bottom-1"
              :chain="String(session.chainId)"
            />
          </div>

          <div class="flex-1 text-left">
            <div>{{ session.peerMeta.name }}</div>
            <div
              class="text-sm"
              :class="{ 'text-green-400': session.connected }"
            >
              {{ session.connected ? "Connected" : "Connect" }}
            </div>
          </div>

          <div class="flex items-center space-x-5">
            <a
              v-tippy="'Open in new link'"
              :href="session.peerMeta.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.83279 16.1182L1.8826 14.168C0.983075 13.2684 0.868512 11.8494 1.61209 10.8172C2.1678 10.0458 2.84691 9.37134 3.62209 8.82093L4.0472 8.51909C4.84263 7.9543 5.92948 8.0458 6.6193 8.73561L6.6743 8.79062L9.241 11.3573L9.26515 11.3815C9.95496 12.0713 10.0465 13.1581 9.48167 13.9536L9.17983 14.3787C8.62942 15.1539 7.95494 15.833 7.18355 16.3887C6.15138 17.1322 4.73232 17.0177 3.83279 16.1182Z"
                  stroke="#4E80EE"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M16.1182 3.83206L14.168 1.88187C13.2684 0.982343 11.8494 0.867779 10.8172 1.61136C10.0458 2.16706 9.37134 2.84618 8.82093 3.62136L8.51909 4.04647C7.9543 4.8419 8.0458 5.92875 8.73561 6.61857L8.79061 6.67357L11.3573 9.24027L11.3815 9.26441C12.0713 9.95423 13.1581 10.0457 13.9536 9.48094L14.3787 9.17909C15.1539 8.62869 15.833 7.95421 16.3887 7.18282C17.1322 6.15065 17.0177 4.73158 16.1182 3.83206Z"
                  stroke="#4E80EE"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.393 6.60645L6.61719 11.3823"
                  stroke="#4E80EE"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>

            <button v-tippy="'Disconnect'" @click="wcStore.disconnect(session)">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.5 4.5L4.5 13.5"
                  stroke="#94A3B8"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4.5 4.5L13.5 13.5"
                  stroke="#94A3B8"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <CommonInput v-model="uri" placeholder="QR code or link" />

    <CommonButton
      @click="prepareAndConnect"
      class="w-full justify-center"
      size="lg"
    >
      Connect
    </CommonButton>
  </div>

  <div v-else class="space-y-8">
    <div class="flex flex-col items-center space-y-8">
      <div class="w-10 h-10" v-if="connection.peerMeta.icons.length">
        <img
          class="w-full h-full object-fit"
          :src="connection.peerMeta.icons[connection.peerMeta.icons.length - 1]"
        />
      </div>

      <span> {{ connection.peerMeta.name }} Wants to Connect </span>
    </div>

    <p class="text-slate-400 text-xs text-center">
      You need the Avocado web app to be open to popup transactions. You will
      not receive transaction requests when it is not open. Please don't close
      the tab.
    </p>

    <div class="text-blue-500 text-sm">
      {{ connection.peerMeta.url }}
    </div>

    <select
      v-model="connectionChainId"
      class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full"
    >
      <option :value="137">Polygon</option>
      <option :value="1">Mainnet</option>
      <option :value="10">Optimism</option>
      <option :value="250">Fantom</option>
      <option :value="43114">Avalanche</option>
      <option :value="42161">Arbitrum</option>
    </select>

    <button
      class="bg-blue-500 hover:bg-blue-600 rounded-[15px] w-full h-12"
      @click="connect"
    >
      Approve
    </button>
  </div>
</template>

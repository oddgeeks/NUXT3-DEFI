<script setup lang="ts">
import SVGQr from "~/assets/images/icons/qr.svg?component";
const wcStore = useWalletConnect();

const uri = ref();
const connection = shallowRef();
const connectionChainId = shallowRef(137);
const { closeModal } = useModal();

const [loading, toggle] = useToggle(false)
 
const networks = [
  {
    chainId: 137,
    name: "Polygon",
  },
  {
    chainId: 1,
    name: "Mainnet",
  },
  {
    chainId: 10,
    name: "Optimism",
  },
  {
    chainId: 250,
    name: "Fantom",
  },
  {
    chainId: 43114,
    name: "Avalanche",
  },
  {
    chainId: 42161,
    name: "Arbitrum",
  },
];

const prepareAndConnect = async () => {
  if (!uri.value) {
    return;
  }

  try {
    toggle(true)
    connection.value = await wcStore.prepareConnection(uri.value);
    connectionChainId.value = connection.value.chainId;
    uri.value = null;
  } catch (e: any) {
    console.log(e)
    openDialogModal({
      title: "Connected Failed",
      content: "Try again or return to the home page.",
      type: "error",
      buttonText: "Try Again",
    });
  } finally {
    toggle(false)
  }
};

const connect = async () => {
  try {
    toggle(true)
    await wcStore.connect(
      connection.value.connector,
      connection.value.storageId,
      connectionChainId.value
    );

    closeModal();
    openDialogModal({
      title: "Connected Successfully",
      content: `You can now use <a target='_blank' rel='noopener noreferrer' class='text-blue-500' href=${connection.value.peerMeta.url}>
        ${connection.value.peerMeta.name}
        </a> with your Avocado wallet.`,
      type: "success",
      isButtonVisible: false
    });

    uri.value = null;
    connection.value = undefined;
   
  } catch (e) {
    closeModal();
    openDialogModal({
      title: "Connected Failed",
      content: "Try again or return to the home page.",
      type: "error",
      buttonText: "Try Again",
    });
  } finally {
    toggle(false)
  }
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

    <CommonInput v-model="uri" placeholder="QR code or link">
      <template #suffix>
        <SVGQr class="absolute top-1/2 right-4 -translate-y-1/2" />
      </template>
    </CommonInput>

    <CommonButton
      :loading="loading"
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

    <div class="text-blue-500 text-sm text-center">
      {{ connection.peerMeta.url }}
    </div>

    <CommonSelect
      v-model="connectionChainId"
      labelKey="name"
      valueKey="chainId"
      :options="networks"
    >
      <template #button-prefix>
        <ChainLogo class="w-6 h-6" :chain="connectionChainId" />
      </template>
      <template #item-prefix="{ value }">
        <ChainLogo class="w-6 h-6" :chain="value" />
      </template>
    </CommonSelect>

    <CommonButton  :loading="loading" @click="connect" class="w-full justify-center" size="lg">
      Approve
    </CommonButton>
  </div>
</template>

import { storeToRefs } from "pinia";

export const useBanner = () => {
  const provider = getRpcProvider(75);
  const { gasBalance } = storeToRefs(useSafe());
  const { account, chainId } = useWeb3();

  const { trackingAccount } = useAccountTrack();
  const isHideWelcomeBanner = useLocalStorage("hide-welcome-banner", false);

  const showWelcomeBanner = computed(() => {
    if (!account.value) return false;
    if (isHideWelcomeBanner.value) return false;
    return true;
  });

  const showInsufficientGasBanner = computed(() => {
    return account.value && chainId.value === 75 && lte(gasBalance.value, 0.1);
  });

  const showIncorrectNetworkBanner = computed(
    () => account.value && chainId.value !== 75
  );

  const showGasGiftBanner = asyncComputed(async () => {
    if (!account.value) return false;
    if (chainId.value !== 75) return false;

    const resp = await provider.send("api_hasAirdrop", [account.value]);
    if (!resp) return false;

    return true;
  });

  return {
    showWelcomeBanner,
    showInsufficientGasBanner,
    showIncorrectNetworkBanner,
    showGasGiftBanner,
    showTrackingBanner: computed(() => !!trackingAccount.value),
    toggleWelcomeBanner: (val: boolean) => (isHideWelcomeBanner.value = !val),
  };
};

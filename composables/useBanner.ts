import { storeToRefs } from "pinia";

export const useBanner = () => {
  const { gasBalance } = storeToRefs(useSafe());
  const { account, chainId } = useWeb3();
  const { airDrop } = useAvocadoSafe();

  const { trackingAccount } = useAccountTrack();
  const isHideWelcomeBanner = useLocalStorage("hide-welcome-banner", false);

  const showWelcomeBanner = computed(() => {
    if (!account.value) return false;
    if (isHideWelcomeBanner.value) return false;
    return true;
  });

  const showInsufficientGasBanner = computed(() => {
    return account.value && chainId.value === 634 && lte(gasBalance.value, 0.1);
  });

  const showIncorrectNetworkBanner = computed(
    () => account.value && chainId.value !== 634
  );

  const showGasGiftBanner = computed(() => {
    if (!account.value) return false;
    if (chainId.value !== 634) return false;

    // this is a tricky way to make sure the gas balance is updated
    gt(gasBalance.value, 0);

    if (!airDrop.value) return false;

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

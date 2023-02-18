import { storeToRefs } from "pinia";

export const useBanner = () => {
  const { gasBalance, pending } = storeToRefs(useSafe());
  const { account, chainId } = useWeb3();
  const { airDrop } = useAvocadoSafe();

  const { trackingAccount } = useAccountTrack();
  const isHideWelcomeBanner = useLocalStorage("hide-welcome-banner", false);
  const isHideOnboardBanner = useLocalStorage("hide-onboard-banner", false);
  const isOnboardHidden = computed(() => useStatefulCookie(`hide-onboard-${account.value}`));

  const showWelcomeBanner = computed(() => {
    if (!account.value) return false;
    if (isHideWelcomeBanner.value) return false;
    return true;
  });

  const showInsufficientGasBanner = computed(() => {
    if (pending.value.global) return false;

    return account.value && chainId.value === 634 && lte(gasBalance.value, 0.1);
  });

  const showIncorrectNetworkBanner = computed(
    () => account.value && chainId.value !== 634
  );

  const showGasGiftBanner = computed(() => {
    if (!account.value) return false;
    if (chainId.value !== 634) return false;
    if (pending.value.global) return false;

    if (!airDrop.value) return false;

    return true;
  });

  const showOnboardBanner = computed(() => {
    if (!account.value) return false;
    if (isOnboardHidden.value.value) return false;
    return true;
  });

  return {
    showWelcomeBanner,
    showInsufficientGasBanner,
    showIncorrectNetworkBanner,
    showGasGiftBanner,
    showOnboardBanner,
    showTrackingBanner: computed(() => !!trackingAccount.value),
    toggleWelcomeBanner: (val: boolean) => (isHideWelcomeBanner.value = !val),
    hideOnboardBanner: () => isOnboardHidden.value.value = true
  };
};

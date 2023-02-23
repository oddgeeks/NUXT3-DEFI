import { storeToRefs } from "pinia";
import { gt } from "semver";

export const useBanner = () => {
  const { gasBalance, pending, safeAddress } = storeToRefs(useSafe());
  const { account, chainId } = useWeb3();
  const { airDrop } = useAvocadoSafe();

  const { trackingAccount } = useAccountTrack();
  const isHideWelcomeBanner = useLocalStorage("hide-welcome-banner", false);
  const isOnboardHidden = computed(() =>
    useStatefulCookie(`hide-onboard-${account.value}`)
  );

  const isVersionUpdateBannerHidden = computed(() =>
    useStatefulCookie(`version-update-${safeAddress.value}`)
  );

  const allNetworkVersions = useNuxtData("allNetworkVersions");

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
    () => !trackingAccount.value && account.value && chainId.value !== 634
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

  const showVersionUpdateBanner = computed(() => {
    if (!account.value) return false;
    const allVersions = allNetworkVersions.data.value as NetworkVersion[];
    if (!allVersions?.length) return false;
    if (isVersionUpdateBannerHidden.value?.value) return false;

    return allVersions.some((network) =>
      gt(network.latestVersion, network.currentVersion)
    );
  });

  return {
    showWelcomeBanner,
    showInsufficientGasBanner,
    showIncorrectNetworkBanner,
    showGasGiftBanner,
    showOnboardBanner,
    isVersionUpdateBannerHidden,
    showVersionUpdateBanner,
    showTrackingBanner: computed(() => !!trackingAccount.value),
    toggleWelcomeBanner: (val: boolean) => (isHideWelcomeBanner.value = !val),
    hideOnboardBanner: () => (isOnboardHidden.value.value = true),
    hideVersionUpdateBanner: () =>
      (isVersionUpdateBannerHidden.value.value = true),
  };
};

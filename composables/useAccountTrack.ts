import { network } from "~~/connectors";

export function useAccountTrack() {
  const { account, library, activate } = useWeb3();
  const trackingAccount = useLocalStorage<string>("trackAccount", null);
  const route = useRoute();
  const router = useRouter();

  const init = async () => {
    if (route.query?.address) {
      trackingAccount.value = route.query.address as string;
      router.replace({ query: {} });
    }
    if (trackingAccount.value) {
      account.value = trackingAccount.value;
      await until(library).changed();
      // Set account after web3 library is loaded
      account.value = trackingAccount.value;
    }
  }

  tryOnMounted(init)

  return {
    trackingAccount,
  };
}

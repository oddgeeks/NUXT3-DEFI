export function useAccountTrack(onSuccess?: () => void, onFailure?: () => void) {
  const { account, library } = useWeb3();
  const trackingAccount = useLocalStorage<string>("trackAccount", null);
  const route = useRoute();
  const router = useRouter();

  const init = async () => {
    if (route.query?.user) {
      trackingAccount.value = route.query.user as string;
      router.replace({ query: {} });
    }
    if (trackingAccount.value) {
      account.value = trackingAccount.value;
      onSuccess?.()
    }else{
      onFailure?.()
    }
  };

  onNuxtReady(init);

  return {
    trackingAccount,
  };
}

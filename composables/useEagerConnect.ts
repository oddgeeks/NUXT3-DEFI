import { injected, walletconnect } from "../connectors";

export function useEagerConnect() {
  const { activate, active, provider } = useWeb3();
  const { getConnector } = useConnectors()

  const tried = ref(false);

  onMounted(() => {
    let connector = getConnector()
    connector &&  activate(connector, undefined, true).catch(() => {
      tried.value = true;
    });

    // injected.isAuthorized().then((isAuthorized: boolean) => {
    //   if (isAuthorized) {
    //     activate(injected, undefined, true).catch(() => {
    //       tried.value = true;
    //     });
    //   } else {
    //     tried.value = true;
    //   }
    // });
  });

  // if the connection worked, wait until we get confirmation of that to flip the flag
  watch([tried, active], () => {
    if (!tried.value && active.value) {
      tried.value = true;
    }
  });

  return {
    tried
  };
}

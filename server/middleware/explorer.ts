// Redirect to existing tx and address pages to the new explorer
export default defineEventHandler((event) => {
  const url = event.node.req.url;
  const txPath = "/tx/";
  const addressPath = "/address/";

  const { public: publicConfig } = useRuntimeConfig();

  const prod = publicConfig.env === "release";

  const explorerURL = prod ? AVO_PROD_EXPLORER_URL : AVO_STAGING_EXPLORER_URL;

  if (url) {
    const redirectPath = url.startsWith(txPath)
      ? txPath
      : url.startsWith(addressPath)
      ? addressPath
      : null;

    if (redirectPath) {
      const newUrl = url.replace(redirectPath, explorerURL + redirectPath);
      return sendRedirect(event, newUrl);
    }
  }
});

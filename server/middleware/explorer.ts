import { avoExplorerURL } from "../../utils/avocado";

// Redirect to existing tx and address pages to the new explorer
export default defineEventHandler((event) => {
  const url = event.node.req.url;
  const txPath = "/tx/";
  const addressPath = "/address/";

  if (url) {
    const redirectPath = url.startsWith(txPath)
      ? txPath
      : url.startsWith(addressPath)
      ? addressPath
      : null;

    if (redirectPath) {
      const newUrl = url.replace(redirectPath, avoExplorerURL + redirectPath);
      return sendRedirect(event, newUrl);
    }
  }
});

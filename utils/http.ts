import { ofetch } from "ofetch";

export default ofetch.create({
  retry: 3,
});

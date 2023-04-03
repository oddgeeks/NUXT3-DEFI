import { AnkrProvider } from "@ankr.com/ankr.js";

const provider = new AnkrProvider();

const nfts = await provider.getNFTsByOwner({
  walletAddress: "0x32b271D89178724141a644a6efD7fF5512Cd900a",
  pageSize: 50,
});

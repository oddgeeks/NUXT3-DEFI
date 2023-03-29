import axios from "axios";
import { AnkrProvider } from "@ankr.com/ankr.js";
import { object, array, string } from "yup";

const flashloanAddress = "0x8d8B52e9354E2595425D00644178E2bA2257f42a";

export default defineEventHandler(async (event) => {
  try {
    const { ankrApiKey } = useRuntimeConfig();

    const ankrProvider = new AnkrProvider(ankrApiKey);
    const params = await readBody(event);

    async function transformToken(token: SimulationToken) {
      const nft = await ankrProvider.getNFTMetadata({
        blockchain: blockchain(parsed.chainId) as any,
        contractAddress: token.token,
        tokenId: "1", // passed randomly
        forceFetch: true,
      });
      if (nft.metadata?.collectionName) {
        token.type = "NFT";
        token.nftMetadata = nft.attributes as any;
      } else {
        token.type =
          token.from.toLowerCase() === flashloanAddress.toLowerCase() ||
          token.to.toLowerCase() === flashloanAddress.toLowerCase()
            ? "Flashloan"
            : token.from.startsWith("0x0000")
            ? "Mint"
            : token.to.startsWith("0x0000")
            ? "Burn"
            : null;
      }

      return token;
    }

    const schema = object().shape({
      actions: array().required(),
      id: string().default("1"),
      avocadoSafe: string().required(),
      chainId: string().required(),
    });

    await schema.validate(params);

    const parsed = schema.cast(params);

    const url =
      "https://microservices-theta.vercel.app/api/avocado/tenderly/simulate";

    const resp = await axios.post(url, {
      actions: parsed.actions,
      id: parsed.id,
      avocadoSafe: parsed.avocadoSafe,
      chainId: parsed.chainId,
    });

    const data = resp.data as ISimulation;

    await Promise.all([
      ...data.balanceChange.sendTokens.map(transformToken),
      ...data.balanceChange.receiveTokens.map(transformToken),
    ]);

    return data;
  } catch (e: any) {
    console.log(e);
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: e?.message,
    });
  }
});

const blockchain = (chainId: string | undefined) => {
  switch (chainId) {
    case "1":
      return "eth";
    case "10":
      return "optimism";
    case "56":
      return "bsc";
    case "137":
      return "polygon";
    case "42161":
      return "arbitrum";
    case "43114":
      return "avalanche";
  }
};

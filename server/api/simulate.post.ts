import axios from "axios";
import { AnkrProvider } from "@ankr.com/ankr.js";
import { object, array, string } from "yup";

export default defineEventHandler(async (event) => {
  try {
    const { ankrApiKey } = useRuntimeConfig();

    const ankrProvider = new AnkrProvider(ankrApiKey);
    const params = await readBody(event);

    async function transformTokenToNFT(token: SimulationToken) {
      const nft = await ankrProvider.getNFTMetadata({
        blockchain: blockchain(parsed.chainId) as any,
        contractAddress: token.token,
        tokenId: "1", // passed randomly
        forceFetch: true,
      });
      if (nft.metadata?.collectionName) {
        token.type = "nft";
        token.nftMetadata = nft.attributes as any;
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
      ...data.balanceChange.sendTokens.map(transformTokenToNFT),
      ...data.balanceChange.receiveTokens.map(transformTokenToNFT),
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

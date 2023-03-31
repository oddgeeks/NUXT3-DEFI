import axios from "axios";
import { AnkrProvider } from "@ankr.com/ankr.js";
import { object, array, string } from "yup";

export default defineEventHandler(async (event) => {
  try {
    const { ankrApiKey } = useRuntimeConfig();

    const ankrProvider = new AnkrProvider(ankrApiKey);
    const params = await readBody(event);

    async function transformToken(token: SimulationToken) {
      const chainName = blockchain(parsed.chainId) as any;

      const nft = chainName
        ? await ankrProvider.getNFTMetadata({
            blockchain: blockchain(parsed.chainId) as any,
            contractAddress: token.token,
            tokenId: "1", // passed randomly
            forceFetch: true,
          })
        : null;

      if (nft?.metadata?.collectionName) {
        token.type = "NFT";
        token.nftMetadata = nft.attributes as any;
      } else {
        token.type = getSimulationTag(token.to, token.from);
      }

      return token;
    }

    const schema = object().shape({
      actions: array().required(),
      id: string().default("21"),
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

    if (!data?.balanceChange) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "No balance change",
      });
    }

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

const getSimulationTag = (toAddress: string, fromAddress: string) => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const avoFlashloanAddress = "0x8d8B52e9354E2595425D00644178E2bA2257f42a";

  if (
    fromAddress.toLowerCase() === avoFlashloanAddress.toLowerCase() ||
    toAddress.toLowerCase() === avoFlashloanAddress.toLowerCase()
  ) {
    return "Flashloan";
  }

  if (fromAddress.toLowerCase() === zeroAddress.toLowerCase()) {
    return "Mint";
  }

  if (toAddress.toLowerCase() === zeroAddress.toLowerCase()) {
    return "Burn";
  }

  return null;
};

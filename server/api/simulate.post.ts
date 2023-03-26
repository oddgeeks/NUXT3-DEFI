import axios from "axios";
import { object, array, string } from "yup";

export default defineEventHandler(async (event) => {
  try {
    const params = await readBody(event);

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

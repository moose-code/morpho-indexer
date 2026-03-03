import { createEffect, S } from "envio";
import { createPublicClient, http, parseAbi } from "viem";

const ERC20_ABI = parseAbi(["function decimals() view returns (uint8)"]);

const FREE_RPC: Record<number, string> = {
  1: "https://eth.drpc.org",
  8453: "https://base.drpc.org",
  130: "https://unichain.drpc.org",
  137: "https://polygon.drpc.org",
  42161: "https://arbitrum.drpc.org",
  10: "https://optimism.drpc.org",
  2741: "https://abstract.drpc.org",
  42220: "https://celo.drpc.org",
  252: "https://fraxtal.drpc.org",
  57073: "https://ink.drpc.org",
  1135: "https://lisk.drpc.org",
  34443: "https://mode.drpc.org",
  98866: "https://plume.drpc.org",
  534352: "https://scroll.drpc.org",
  1329: "https://sei.drpc.org",
  1868: "https://soneium.drpc.org",
  146: "https://sonic.drpc.org",
  480: "https://worldchain.drpc.org",
  48900: "https://zircuit.drpc.org",
  143: "https://monad.drpc.org",
};

const RPC_URLS: Record<number, string> = Object.fromEntries(
  Object.entries(FREE_RPC).map(([chainId, freeUrl]) => [
    chainId,
    process.env[`RPC_URL_${chainId}`] || freeUrl,
  ]),
);

export const getDecimals = createEffect(
  {
    name: "getDecimals",
    input: S.schema({
      address: S.string,
      chainId: S.number,
    }),
    output: S.number,
    cache: true,
    rateLimit: false,
  },
  async ({ input }) => {
    const rpcUrl = RPC_URLS[input.chainId];
    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    const decimals = await client.readContract({
      address: input.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "decimals",
    });

    return Number(decimals);
  },
);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function marketId(chainId: number, id: string): string {
  return `${chainId}-${id}`;
}

export function positionId(
  chainId: number,
  marketId: string,
  user: string,
): string {
  return `${chainId}-${marketId}-${user}`;
}

export function authorizationId(
  chainId: number,
  authorizer: string,
  authorizee: string,
): string {
  return `${chainId}-${authorizer}-${authorizee}`;
}

export function preLiquidationContractId(
  chainId: number,
  marketId: string,
  address: string,
): string {
  return `${chainId}-${marketId}-${address}`;
}

export function vaultId(chainId: number, address: string): string {
  return `${chainId}-${address}`;
}

export function vaultBalanceId(
  chainId: number,
  vaultAddress: string,
  user: string,
): string {
  return `${chainId}-${vaultAddress}-${user}`;
}

export function vaultConfigItemId(
  chainId: number,
  vaultAddress: string,
  marketId: string,
): string {
  return `${chainId}-${vaultAddress}-${marketId}`;
}

export function vaultQueueItemId(
  chainId: number,
  vaultAddress: string,
  ordinal: number,
): string {
  return `${chainId}-${vaultAddress}-${ordinal}`;
}

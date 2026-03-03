import { MetaMorphoFactory, MetaMorpho } from "generated";
import { getDecimals } from "../effects/getDecimals.js";
import {
  ZERO_ADDRESS,
  vaultId,
  vaultBalanceId,
  vaultConfigItemId,
  vaultQueueItemId,
  marketId,
} from "../utils/ids.js";

/*//////////////////////////////////////////////////////////////
                        CONTRACT REGISTER
//////////////////////////////////////////////////////////////*/

MetaMorphoFactory.CreateMetaMorpho.contractRegister(({ event, context }) => {
  context.addMetaMorpho(event.params.metaMorpho);
});

/*//////////////////////////////////////////////////////////////
                        CREATE VAULT
//////////////////////////////////////////////////////////////*/

MetaMorphoFactory.CreateMetaMorpho.handler(async ({ event, context }) => {
  const decimalsUnderlying = await context.effect(getDecimals, {
    address: event.params.asset,
    chainId: event.chainId,
  });
  const decimalsOffset = Math.max(0, 18 - decimalsUnderlying);

  const id = vaultId(event.chainId, event.params.metaMorpho);

  context.Vault.set({
    id,
    chainId: event.chainId,
    address: event.params.metaMorpho,
    asset: event.params.asset,
    decimalsUnderlying,
    decimalsOffset,
    totalSupply: 0n,
    owner: event.params.initialOwner,
    pendingOwner: ZERO_ADDRESS,
    curator: ZERO_ADDRESS,
    allocators: [],
    guardian: ZERO_ADDRESS,
    timelock: event.params.initialTimelock,
    pendingGuardian: ZERO_ADDRESS,
    pendingGuardianValidAt: 0n,
    pendingTimelock: 0n,
    pendingTimelockValidAt: 0n,
    fee: 0n,
    feeRecipient: ZERO_ADDRESS,
    skimRecipient: ZERO_ADDRESS,
    supplyQueueLength: 0,
    withdrawQueueLength: 0,
    lastTotalAssets: 0n,
    lostAssets: 0n,
    name: event.params.name,
    symbol: event.params.symbol,
  });
});

/*//////////////////////////////////////////////////////////////
                            OWNERSHIP
//////////////////////////////////////////////////////////////*/

MetaMorpho.OwnershipTransferStarted.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    pendingOwner: event.params.newOwner,
  });
});

MetaMorpho.OwnershipTransferred.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    owner: event.params.newOwner,
    pendingOwner: ZERO_ADDRESS,
  });
});

/*//////////////////////////////////////////////////////////////
                              SUBMIT
//////////////////////////////////////////////////////////////*/

MetaMorpho.SubmitCap.handler(async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  const timelock = v?.timelock ?? 0n;

  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const existing = await context.VaultConfigItem.get(configId);

  if (existing) {
    context.VaultConfigItem.set({
      ...existing,
      pendingCap: event.params.cap,
      pendingCapValidAt: BigInt(event.block.timestamp) + timelock,
    });
  } else {
    context.VaultConfigItem.set({
      id: configId,
      chainId: event.chainId,
      vault_id: vId,
      market_id: marketId(event.chainId, event.params.id),
      cap: 0n,
      pendingCap: event.params.cap,
      pendingCapValidAt: BigInt(event.block.timestamp) + timelock,
      enabled: false,
      removableAt: 0n,
    });
  }
});

MetaMorpho.SubmitGuardian.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  const timelock = existing.timelock;

  context.Vault.set({
    ...existing,
    pendingGuardian: event.params.newGuardian,
    pendingGuardianValidAt: BigInt(event.block.timestamp) + timelock,
  });
});

MetaMorpho.SubmitMarketRemoval.handler(async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  const timelock = v?.timelock ?? 0n;

  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const existing = await context.VaultConfigItem.get(configId);
  if (!existing) return;

  context.VaultConfigItem.set({
    ...existing,
    removableAt: BigInt(event.block.timestamp) + timelock,
  });
});

MetaMorpho.SubmitTimelock.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  const timelock = existing.timelock;

  context.Vault.set({
    ...existing,
    pendingTimelock: event.params.newTimelock,
    pendingTimelockValidAt: BigInt(event.block.timestamp) + timelock,
  });
});

/*//////////////////////////////////////////////////////////////
                              REVOKE
//////////////////////////////////////////////////////////////*/

MetaMorpho.RevokePendingCap.handler(async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const existing = await context.VaultConfigItem.get(configId);

  if (existing) {
    context.VaultConfigItem.set({
      ...existing,
      pendingCap: 0n,
      pendingCapValidAt: 0n,
    });
  } else {
    context.VaultConfigItem.set({
      id: configId,
      chainId: event.chainId,
      vault_id: vId,
      market_id: marketId(event.chainId, event.params.id),
      cap: 0n,
      pendingCap: 0n,
      pendingCapValidAt: 0n,
      enabled: false,
      removableAt: 0n,
    });
  }
});

MetaMorpho.RevokePendingGuardian.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    pendingGuardian: ZERO_ADDRESS,
    pendingGuardianValidAt: 0n,
  });
});

MetaMorpho.RevokePendingMarketRemoval.handler(async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const existing = await context.VaultConfigItem.get(configId);

  if (existing) {
    context.VaultConfigItem.set({
      ...existing,
      removableAt: 0n,
    });
  } else {
    context.VaultConfigItem.set({
      id: configId,
      chainId: event.chainId,
      vault_id: vId,
      market_id: marketId(event.chainId, event.params.id),
      cap: 0n,
      pendingCap: 0n,
      pendingCapValidAt: 0n,
      enabled: false,
      removableAt: 0n,
    });
  }
});

MetaMorpho.RevokePendingTimelock.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    pendingTimelock: 0n,
    pendingTimelockValidAt: 0n,
  });
});

/*//////////////////////////////////////////////////////////////
                              SET
//////////////////////////////////////////////////////////////*/

MetaMorpho.SetCap.handler(async ({ event, context }) => {
  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const existing = await context.VaultConfigItem.get(configId);
  if (!existing) return;

  context.VaultConfigItem.set({
    ...existing,
    cap: event.params.cap,
    pendingCap: 0n,
    pendingCapValidAt: 0n,
    ...(event.params.cap > 0n ? { enabled: true, removableAt: 0n } : {}),
  });
});

MetaMorpho.SetCurator.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    curator: event.params.newCurator,
  });
});

MetaMorpho.SetVaultFee.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    fee: event.params.newFee,
  });
});

MetaMorpho.SetFeeRecipient.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    feeRecipient: event.params.newFeeRecipient,
  });
});

MetaMorpho.SetGuardian.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    guardian: event.params.guardian,
    pendingGuardian: ZERO_ADDRESS,
    pendingGuardianValidAt: 0n,
  });
});

MetaMorpho.SetIsAllocator.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  const allocators = existing.allocators as string[];
  const set = new Set(allocators);
  if (event.params.isAllocator) {
    set.add(event.params.allocator);
  } else {
    set.delete(event.params.allocator);
  }

  context.Vault.set({
    ...existing,
    allocators: [...set],
  });
});

MetaMorpho.SetName.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    name: event.params.name,
  });
});

MetaMorpho.SetSkimRecipient.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    skimRecipient: event.params.newSkimRecipient,
  });
});

MetaMorpho.SetSymbol.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    symbol: event.params.symbol,
  });
});

MetaMorpho.SetTimelock.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    timelock: event.params.newTimelock,
    pendingTimelock: 0n,
    pendingTimelockValidAt: 0n,
  });
});

/*//////////////////////////////////////////////////////////////
                              QUEUES
//////////////////////////////////////////////////////////////*/

MetaMorpho.SetSupplyQueue.handler(async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  if (!v) return;

  const oldLength = v.supplyQueueLength;
  const newQueue = event.params.newSupplyQueue;

  context.Vault.set({
    ...v,
    supplyQueueLength: newQueue.length,
  });

  const maxLen = Math.max(oldLength, newQueue.length);
  for (let ordinal = 0; ordinal < maxLen; ordinal++) {
    const queueItemId = vaultQueueItemId(
      event.chainId,
      event.srcAddress,
      ordinal,
    );
    const queueMarketId = newQueue[ordinal] ?? undefined;

    const existing = await context.VaultSupplyQueueItem.get(queueItemId);
    if (existing) {
      context.VaultSupplyQueueItem.set({
        ...existing,
        market_id: queueMarketId
          ? marketId(event.chainId, queueMarketId)
          : undefined,
      });
    } else {
      context.VaultSupplyQueueItem.set({
        id: queueItemId,
        chainId: event.chainId,
        vault_id: vId,
        ordinal,
        market_id: queueMarketId
          ? marketId(event.chainId, queueMarketId)
          : undefined,
      });
    }
  }
});

MetaMorpho.SetWithdrawQueue.handler(async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  if (!v) return;

  const oldLength = v.withdrawQueueLength;
  const newQueue = event.params.newWithdrawQueue;

  context.Vault.set({
    ...v,
    withdrawQueueLength: newQueue.length,
  });

  const maxLen = Math.max(oldLength, newQueue.length);
  for (let ordinal = 0; ordinal < maxLen; ordinal++) {
    const queueItemId = vaultQueueItemId(
      event.chainId,
      event.srcAddress,
      ordinal,
    );
    const queueMarketId = newQueue[ordinal] ?? undefined;

    const existing = await context.VaultWithdrawQueueItem.get(queueItemId);
    if (existing) {
      context.VaultWithdrawQueueItem.set({
        ...existing,
        market_id: queueMarketId
          ? marketId(event.chainId, queueMarketId)
          : undefined,
      });
    } else {
      context.VaultWithdrawQueueItem.set({
        id: queueItemId,
        chainId: event.chainId,
        vault_id: vId,
        ordinal,
        market_id: queueMarketId
          ? marketId(event.chainId, queueMarketId)
          : undefined,
      });
    }
  }
});

/*//////////////////////////////////////////////////////////////
                          SHARES/ASSETS
//////////////////////////////////////////////////////////////*/

MetaMorpho.Transfer.handler(async ({ event, context }) => {
  if (event.params.value === 0n) return;

  const vId = vaultId(event.chainId, event.srcAddress);

  if (event.params.from === ZERO_ADDRESS) {
    // Mint — increase totalSupply
    const v = await context.Vault.get(vId);
    if (v) {
      context.Vault.set({
        ...v,
        totalSupply: v.totalSupply + event.params.value,
      });
    }
  } else {
    // Not a mint — subtract from sender's balance
    const fromBalanceId = vaultBalanceId(
      event.chainId,
      event.srcAddress,
      event.params.from,
    );
    const fromBalance = await context.VaultBalance.get(fromBalanceId);
    if (fromBalance) {
      context.VaultBalance.set({
        ...fromBalance,
        shares: fromBalance.shares - event.params.value,
      });
    }
  }

  if (event.params.to === ZERO_ADDRESS) {
    // Burn — decrease totalSupply
    const v = await context.Vault.get(vId);
    if (v) {
      context.Vault.set({
        ...v,
        totalSupply: v.totalSupply - event.params.value,
      });
    }
  } else {
    // Not a burn — add to receiver's balance (upsert)
    const toBalanceId = vaultBalanceId(
      event.chainId,
      event.srcAddress,
      event.params.to,
    );
    const toBalance = await context.VaultBalance.get(toBalanceId);
    if (toBalance) {
      context.VaultBalance.set({
        ...toBalance,
        shares: toBalance.shares + event.params.value,
      });
    } else {
      context.VaultBalance.set({
        id: toBalanceId,
        chainId: event.chainId,
        vault_id: vId,
        user: event.params.to,
        shares: event.params.value,
      });
    }
  }
});

MetaMorpho.UpdateLastTotalAssets.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    lastTotalAssets: event.params.updatedTotalAssets,
  });
});

MetaMorpho.UpdateLostAssets.handler(async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    lostAssets: event.params.newLostAssets,
  });
});

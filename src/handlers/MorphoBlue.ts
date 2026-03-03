import { Morpho } from "generated";
import {
  marketId,
  positionId,
  authorizationId,
} from "../utils/ids.js";

Morpho.CreateMarket.handler(async ({ event, context }) => {
  const id = marketId(event.chainId, event.params.id);

  context.Market.set({
    id,
    chainId: event.chainId,
    marketId: event.params.id,
    loanToken: event.params.marketParams[0],
    collateralToken: event.params.marketParams[1],
    oracle: event.params.marketParams[2],
    irm: event.params.marketParams[3],
    lltv: event.params.marketParams[4],
    totalSupplyAssets: 0n,
    totalSupplyShares: 0n,
    totalBorrowAssets: 0n,
    totalBorrowShares: 0n,
    lastUpdate: BigInt(event.block.timestamp),
    fee: 0n,
    rateAtTarget: 0n,
  });
});

Morpho.SetFee.handler(async ({ event, context }) => {
  const id = marketId(event.chainId, event.params.id);
  const existing = await context.Market.get(id);
  if (!existing) return;

  context.Market.set({
    ...existing,
    fee: event.params.newFee,
    lastUpdate: BigInt(event.block.timestamp),
  });
});

Morpho.AccrueInterest.handler(async ({ event, context }) => {
  const id = marketId(event.chainId, event.params.id);
  const existing = await context.Market.get(id);
  if (!existing) return;

  context.Market.set({
    ...existing,
    totalSupplyAssets: existing.totalSupplyAssets + event.params.interest,
    totalSupplyShares: existing.totalSupplyShares + event.params.feeShares,
    totalBorrowAssets: existing.totalBorrowAssets + event.params.interest,
    lastUpdate: BigInt(event.block.timestamp),
  });
});

Morpho.Supply.handler(async ({ event, context }) => {
  // Update market
  const mId = marketId(event.chainId, event.params.id);
  const existingMarket = await context.Market.get(mId);
  if (existingMarket) {
    context.Market.set({
      ...existingMarket,
      totalSupplyAssets: existingMarket.totalSupplyAssets + event.params.assets,
      totalSupplyShares: existingMarket.totalSupplyShares + event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Upsert position
  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const existingPosition = await context.Position.get(pId);
  if (existingPosition) {
    context.Position.set({
      ...existingPosition,
      supplyShares: existingPosition.supplyShares + event.params.shares,
    });
  } else {
    context.Position.set({
      id: pId,
      chainId: event.chainId,
      market_id: mId,
      user: event.params.onBehalf,
      supplyShares: event.params.shares,
      borrowShares: 0n,
      collateral: 0n,
    });
  }
});

Morpho.Withdraw.handler(async ({ event, context }) => {
  // Update market
  const mId = marketId(event.chainId, event.params.id);
  const existingMarket = await context.Market.get(mId);
  if (existingMarket) {
    context.Market.set({
      ...existingMarket,
      totalSupplyAssets: existingMarket.totalSupplyAssets - event.params.assets,
      totalSupplyShares: existingMarket.totalSupplyShares - event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update position
  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const existingPosition = await context.Position.get(pId);
  if (existingPosition) {
    context.Position.set({
      ...existingPosition,
      supplyShares: existingPosition.supplyShares - event.params.shares,
    });
  }
});

Morpho.SupplyCollateral.handler(async ({ event, context }) => {
  // Update market lastUpdate
  const mId = marketId(event.chainId, event.params.id);
  const existingMarket = await context.Market.get(mId);
  if (existingMarket) {
    context.Market.set({
      ...existingMarket,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Upsert position
  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const existingPosition = await context.Position.get(pId);
  if (existingPosition) {
    context.Position.set({
      ...existingPosition,
      collateral: existingPosition.collateral + event.params.assets,
    });
  } else {
    context.Position.set({
      id: pId,
      chainId: event.chainId,
      market_id: mId,
      user: event.params.onBehalf,
      supplyShares: 0n,
      borrowShares: 0n,
      collateral: event.params.assets,
    });
  }
});

Morpho.WithdrawCollateral.handler(async ({ event, context }) => {
  // Update market lastUpdate
  const mId = marketId(event.chainId, event.params.id);
  const existingMarket = await context.Market.get(mId);
  if (existingMarket) {
    context.Market.set({
      ...existingMarket,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update position
  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const existingPosition = await context.Position.get(pId);
  if (existingPosition) {
    context.Position.set({
      ...existingPosition,
      collateral: existingPosition.collateral - event.params.assets,
    });
  }
});

Morpho.Borrow.handler(async ({ event, context }) => {
  // Update market
  const mId = marketId(event.chainId, event.params.id);
  const existingMarket = await context.Market.get(mId);
  if (existingMarket) {
    context.Market.set({
      ...existingMarket,
      totalBorrowAssets: existingMarket.totalBorrowAssets + event.params.assets,
      totalBorrowShares: existingMarket.totalBorrowShares + event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update position
  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const existingPosition = await context.Position.get(pId);
  if (existingPosition) {
    context.Position.set({
      ...existingPosition,
      borrowShares: existingPosition.borrowShares + event.params.shares,
    });
  }
});

Morpho.Repay.handler(async ({ event, context }) => {
  // Update market
  const mId = marketId(event.chainId, event.params.id);
  const existingMarket = await context.Market.get(mId);
  if (existingMarket) {
    context.Market.set({
      ...existingMarket,
      totalBorrowAssets: existingMarket.totalBorrowAssets - event.params.assets,
      totalBorrowShares: existingMarket.totalBorrowShares - event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update position
  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const existingPosition = await context.Position.get(pId);
  if (existingPosition) {
    context.Position.set({
      ...existingPosition,
      borrowShares: existingPosition.borrowShares - event.params.shares,
    });
  }
});

Morpho.Liquidate.handler(async ({ event, context }) => {
  // Update market
  const mId = marketId(event.chainId, event.params.id);
  const existingMarket = await context.Market.get(mId);
  if (existingMarket) {
    context.Market.set({
      ...existingMarket,
      totalSupplyAssets: existingMarket.totalSupplyAssets - event.params.badDebtAssets,
      totalSupplyShares: existingMarket.totalSupplyShares - event.params.badDebtShares,
      totalBorrowAssets: existingMarket.totalBorrowAssets - event.params.repaidAssets,
      totalBorrowShares: existingMarket.totalBorrowShares - event.params.repaidShares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update position
  const pId = positionId(event.chainId, event.params.id, event.params.borrower);
  const existingPosition = await context.Position.get(pId);
  if (existingPosition) {
    context.Position.set({
      ...existingPosition,
      collateral: existingPosition.collateral - event.params.seizedAssets,
      borrowShares:
        existingPosition.borrowShares -
        event.params.repaidShares -
        event.params.badDebtShares,
    });
  }
});

Morpho.SetAuthorization.handler(async ({ event, context }) => {
  const id = authorizationId(
    event.chainId,
    event.params.authorizer,
    event.params.authorized,
  );

  context.Authorization.set({
    id,
    chainId: event.chainId,
    authorizer: event.params.authorizer,
    authorizee: event.params.authorized,
    isAuthorized: event.params.newIsAuthorized,
  });
});

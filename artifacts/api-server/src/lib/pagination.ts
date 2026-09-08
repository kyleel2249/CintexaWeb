import type { Request } from "express";

export interface PageParams {
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Parses ?limit=&offset= from a request, clamping to sane bounds. Offset-
 * based pagination (not keyset) — simple and correct for the current scale;
 * worth revisiting with a createdAt+id cursor if any of these tables grow
 * large enough for offset scans to get expensive.
 */
export function parsePageParams(req: Request): PageParams {
  const rawLimit = Number(req.query.limit);
  const rawOffset = Number(req.query.offset);

  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  return { limit, offset };
}

/** Metadata for the client to know whether/how to fetch the next page, without changing the existing response key. */
export function buildPaginationMeta(params: PageParams, itemsReturned: number, totalCount: number) {
  return {
    limit: params.limit,
    offset: params.offset,
    total: totalCount,
    hasMore: params.offset + itemsReturned < totalCount,
  };
}

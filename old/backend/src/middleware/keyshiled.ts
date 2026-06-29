
import { Hono } from 'hono';

// 临时 pass-through，后续再接真实 keyshiled
export const keyshiled = async (c: any, next: any) => {
  return await next();
};

// The previous implementation has been replaced with a temporary pass-through version.

import { TokenEmbedding } from "./types.ts";

export function semanticSearch(a: TokenEmbedding, b: TokenEmbedding) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}
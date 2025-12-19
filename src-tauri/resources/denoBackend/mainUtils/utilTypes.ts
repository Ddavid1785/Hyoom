export type StreamUpdate = 
  | { type: "status"; message: string }
  | { type: "content"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };
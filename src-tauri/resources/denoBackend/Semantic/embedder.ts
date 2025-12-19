import * as ort from "onnxruntime-node";
import { join } from "std/path/mod.ts";

const modelsDir = join(Deno.cwd(), "Semantic", "models");

class HuggingFaceTokenizer {
  vocab: Map<string, number>;
  specialTokens: { cls: number; sep: number; pad: number; unk: number };

  static async fromFile(tokenizerPath: string) {
    const data = JSON.parse(await Deno.readTextFile(tokenizerPath));
    return new HuggingFaceTokenizer(data);
  }

  constructor(tokenizerData: any) {
    this.vocab = new Map();
    
    if (tokenizerData.model?.vocab) {
      Object.entries(tokenizerData.model.vocab).forEach(([token, id]) => {
        this.vocab.set(token, id as number);
      });
    }

    this.specialTokens = {
      cls: this.vocab.get("[CLS]") || 101,
      sep: this.vocab.get("[SEP]") || 102,
      pad: this.vocab.get("[PAD]") || 0,
      unk: this.vocab.get("[UNK]") || 100,
    };
  }

  tokenize(text: string): string[] {
    const tokens: string[] = [];
    const words = text.toLowerCase().trim().split(/\s+/);

    for (const word of words) {
      if (this.vocab.has(word)) {
        tokens.push(word);
        continue;
      }

      let start = 0;
      const subTokens: string[] = [];

      while (start < word.length) {
        let end = word.length;
        let foundSubToken = false;

        while (start < end) {
          const substr = word.slice(start, end);
          const candidate = start > 0 ? `##${substr}` : substr;

          if (this.vocab.has(candidate)) {
            subTokens.push(candidate);
            start = end;
            foundSubToken = true;
            break;
          }
          end--;
        }

        if (!foundSubToken) {
          subTokens.push("[UNK]");
          start++;
        }
      }

      tokens.push(...subTokens);
    }

    return tokens;
  }

  encode(text: string, maxLength = 512): { input_ids: number[]; attention_mask: number[] } {
    const tokens = this.tokenize(text);
    
    const ids = [
      this.specialTokens.cls,
      ...tokens.map(t => this.vocab.get(t) || this.specialTokens.unk),
      this.specialTokens.sep,
    ];

    const truncated = ids.slice(0, maxLength);
    const attention_mask = new Array(truncated.length).fill(1);

    return { input_ids: truncated, attention_mask };
  }
}

function meanPooling(lastHiddenState: Float32Array, attentionMask: number[]): number[] {
  const dim = lastHiddenState.length / attentionMask.length;
  const result = new Array(dim).fill(0);

  for (let i = 0; i < attentionMask.length; i++) {
    if (attentionMask[i] === 1) {
      for (let j = 0; j < dim; j++) {
        result[j] += lastHiddenState[i * dim + j];
      }
    }
  }

  const sumMask = attentionMask.reduce((a, b) => a + b, 0);
  return result.map(v => v / sumMask);
}

function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(v => v / norm);
}

class Embedder {
  session: ort.InferenceSession;
  tokenizer: HuggingFaceTokenizer;

  static async create(baseDir: string) {
    //console.log("Loading model from:", baseDir);
    
    const modelPath = join(baseDir, "onnx", "model.onnx");
    const tokenizerPath = join(baseDir, "tokenizer.json");

    try {
      const session = await ort.InferenceSession.create(modelPath);
      const tokenizer = await HuggingFaceTokenizer.fromFile(tokenizerPath);
      
      //console.log("✓ Model loaded successfully");
      return new Embedder(session, tokenizer);
    } catch (error) {
      //console.error("Failed to load model:", error);
      throw error;
    }
  }

  constructor(session: ort.InferenceSession, tokenizer: HuggingFaceTokenizer) {
    this.session = session;
    this.tokenizer = tokenizer;
  }

  async __call__(texts: string | string[], options?: { pooling?: string; normalize?: boolean }): Promise<any> {
    const textArray = Array.isArray(texts) ? texts : [texts];
    const embeddings = await Promise.all(textArray.map(text => this.embed(text)));
    
    return {
      data: embeddings.flat(),
      dims: [embeddings.length, embeddings[0].length],
      tolist: () => embeddings,
    };
  }

  async embed(text: string): Promise<number[]> {
    const { input_ids, attention_mask } = this.tokenizer.encode(text);

    const inputIdsTensor = new ort.Tensor(
      "int64",
      BigInt64Array.from(input_ids.map(id => BigInt(id))),
      [1, input_ids.length]
    );

    const attentionMaskTensor = new ort.Tensor(
      "int64",
      BigInt64Array.from(attention_mask.map(m => BigInt(m))),
      [1, attention_mask.length]
    );

    const tokenTypeIdsTensor = new ort.Tensor(
      "int64",
      new BigInt64Array(input_ids.length).fill(0n),
      [1, input_ids.length]
    );

    const results = await this.session.run({
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
      token_type_ids: tokenTypeIdsTensor,
    });

    const lastHiddenState = results.last_hidden_state.data as Float32Array;
    const pooled = meanPooling(lastHiddenState, attention_mask);
    return normalize(pooled);
  }
}

let embedderPromise: Promise<Embedder> | null = null;

export function getEmbedder() {
  if (!embedderPromise) {
    const modelPath = join(modelsDir, "sentence-transformers", "all-MiniLM-L6-v2");
    embedderPromise = Embedder.create(modelPath);
  }
  return embedderPromise;
}
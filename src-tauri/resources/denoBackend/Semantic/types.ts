export type TokenEmbedding = Float32Array;    

export interface ToolInfo{
    name:string,
    description: string,
    relativePath: string,
}

export interface Tool extends ToolInfo{
    embedding: TokenEmbedding,
}

export interface Memory {
  id: string;
  content: string;
  embedding: TokenEmbedding; 
  timestamp: string;
}

export interface StoredMemory {
  id: string;
  content: string;
  embedding: number[]; 
  timestamp: string;
}
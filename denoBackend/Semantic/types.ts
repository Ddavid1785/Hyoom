export type TokenEmbedding = Float32Array;    

export interface ToolInfo{
    name:string,
    description: string,
    relativePath: string,
}

export interface Tool extends ToolInfo{
    embedding: TokenEmbedding,
}
import { getFilePath } from "../filePath.ts";
import { getEmbedder } from "./embedder.ts";
import { TokenEmbedding, Tool, ToolInfo } from "./types.ts";

const FILE_PATH = getFilePath();

export async function createToolValues(tools: ToolInfo[]) {

const embedder = await getEmbedder();

    const toolEmbeddings: Tool[] = [];

    for (const tool of tools) {
        const embeddingArray = await embedder.embed(`${tool.description}. (tool: ${tool.name})`);

        const embedding: TokenEmbedding = new Float32Array(embeddingArray);

        toolEmbeddings.push({
            name: tool.name,
            description: tool.description,
            relativePath: tool.relativePath,
            embedding,
        });
    }

    const json = JSON.stringify(toolEmbeddings, null, 2);

    const filePath = `${FILE_PATH}/toolEmbeddings.json`;
    await Deno.writeTextFile(filePath, json);
}
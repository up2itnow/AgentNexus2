import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

export class VectorMemory {
    private prisma: PrismaClient;
    private openai: OpenAI;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Create a new memory for an agent
     */
    async createMemory(
        agentId: string,
        userId: string,
        content: string,
        metadata: any = {}
    ): Promise<void> {
        try {
            // Generate embedding
            const embedding = await this.generateEmbedding(content);

            // Store in database using raw query for vector type
            // Note: Prisma doesn't support vector type natively in create(), so we use executeRaw
            // We first create the record without embedding, then update it with raw query
            // Or just use raw query for insertion.

            // Let's try creating with Prisma first for ID generation and relations, then update vector
            const memory = await this.prisma.memory.create({
                data: {
                    agentId,
                    userId,
                    content,
                    metadata,
                },
            });

            // Update with vector
            // Format vector as string for Postgres vector syntax: '[1,2,3]'
            const vectorString = `[${embedding.join(',')}]`;

            await this.prisma.$executeRaw`
        UPDATE memories
        SET embedding = ${vectorString}::vector
        WHERE id = ${memory.id}
      `;

        } catch (error) {
            console.error('Error creating memory:', error);
            throw error;
        }
    }

    /**
     * Search for relevant memories
     */
    async searchMemories(
        agentId: string,
        query: string,
        limit: number = 5
    ): Promise<Array<{ content: string; similarity: number; createdAt: Date }>> {
        try {
            const embedding = await this.generateEmbedding(query);
            const vectorString = `[${embedding.join(',')}]`;

            // Perform similarity search using cosine distance (<=> operator)
            // 1 - (a <=> b) gives cosine similarity
            const results = await this.prisma.$queryRaw`
        SELECT 
          content, 
          created_at as "createdAt",
          1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM memories
        WHERE agent_id = ${agentId}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;

            return results as Array<{ content: string; similarity: number; createdAt: Date }>;

        } catch (error) {
            console.error('Error searching memories:', error);
            return [];
        }
    }

    /**
     * Generate embedding using OpenAI
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float',
        });

        return response.data[0].embedding;
    }
}

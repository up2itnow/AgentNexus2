import OpenAI from 'openai';
import { VectorMemory } from '../memory/VectorMemory';
import { AgentZeroAdapter } from './AgentZeroAdapter';

interface Tool {
    name: string;
    description: string;
    execute: (input: string) => Promise<string>;
}

export class AgentZero {
    private openai: OpenAI;
    private memory: VectorMemory;
    private adapter: AgentZeroAdapter;
    private tools: Tool[];

    constructor(memory: VectorMemory, adapter: AgentZeroAdapter) {
        this.memory = memory;
        this.adapter = adapter;
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        this.tools = [
            {
                name: 'code_interpreter',
                description: 'Execute Python code. Input should be valid Python code.',
                execute: async (code: string) => {
                    // Use the adapter to execute code in the secure container
                    // We need a dummy request object here, or refactor adapter to expose a raw execute method
                    // For now, we'll assume we can call a method on adapter or construct a request
                    // Actually, adapter.execute takes a full request. Let's mock a request.
                    // Ideally, we should refactor adapter to separate container management from request handling.
                    // But for now, let's assume we pass a special flag or just use the existing flow.
                    // Wait, adapter.execute spins up a container. We might want to keep the container alive for the session.
                    // The current adapter creates a container per request.
                    // For ReAct, we want a persistent session.
                    // Let's assume for this MVP we spin up a new container for each code block (slow but safe).

                    // TODO: Refactor for persistent sessions
                    const result = await this.adapter.execute({
                        userId: 'system', // or pass real userId
                        agentId: 'agent-zero',
                        prompt: code, // The adapter expects a prompt, but if it's "quick mode", it sends it to the container's API.
                        // The container's API executes the prompt.
                        // If the container is "Agent Zero" image, it expects a chat prompt.
                        // If we want raw code execution, we might need a different endpoint on the container.
                        // Let's assume the prompt IS the code for now, or we wrap it.
                        tier: 'PRO'
                    });
                    return result.response || 'No output';
                }
            },
            {
                name: 'search_memory',
                description: 'Search long-term memory for information. Input is a query string.',
                execute: async (query: string) => {
                    const results = await this.memory.searchMemories('agent-zero', query);
                    return results.map(r => r.content).join('\n');
                }
            }
        ];
    }

    async run(userId: string, prompt: string): Promise<string> {
        // 1. Retrieve Context
        const memories = await this.memory.searchMemories('agent-zero', prompt);
        const context = memories.map(m => m.content).join('\n');

        const systemPrompt = `
You are Agent Zero, an advanced AI capable of reasoning and using tools.
You have access to the following tools:

${this.tools.map(t => `${t.name}: ${t.description}`).join('\n')}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [${this.tools.map(t => t.name).join(', ')}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Context from memory:
${context}
`;

        let messages: any[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Question: ${prompt}` }
        ];

        let steps = 0;
        const maxSteps = 10;

        while (steps < maxSteps) {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages,
                stop: ['Observation:']
            });

            const content = response.choices[0].message?.content || '';
            console.log(`[Step ${steps}] Agent: ${content}`);
            messages.push({ role: 'assistant', content });

            // Parse Action
            const actionMatch = content.match(/Action: (.*)/);
            const inputMatch = content.match(/Action Input: ([\s\S]*)/);

            if (content.includes('Final Answer:')) {
                const finalAnswer = content.split('Final Answer:')[1].trim();

                // Save interaction to memory
                await this.memory.createMemory('agent-zero', userId, `User: ${prompt}\nAgent: ${finalAnswer}`);

                return finalAnswer;
            }

            if (actionMatch && inputMatch) {
                const action = actionMatch[1].trim();
                const input = inputMatch[1].trim();

                const tool = this.tools.find(t => t.name === action);
                if (tool) {
                    console.log(`Executing tool ${action} with input: ${input}`);
                    try {
                        const observation = await tool.execute(input);
                        messages.push({ role: 'user', content: `Observation: ${observation}` });
                    } catch (e) {
                        messages.push({ role: 'user', content: `Observation: Error executing tool: ${e}` });
                    }
                } else {
                    messages.push({ role: 'user', content: `Observation: Tool ${action} not found.` });
                }
            } else {
                // No action found, maybe just thinking or malformed
                messages.push({ role: 'user', content: `Observation: Please specify an Action and Action Input, or Final Answer.` });
            }

            steps++;
        }

        return "I reached the maximum number of steps without finding a final answer.";
    }
}

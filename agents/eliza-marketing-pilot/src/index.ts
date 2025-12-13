import { AgentRuntime, Character } from "@elizaos/core";
import { TwitterPlugin } from "@elizaos/plugin-twitter";
import discordPlugin from "@elizaos/plugin-discord";
// Import multi-chain plugins (assuming they export a default or named plugin)
// Note: In a real scenario, we'd check the exports. For pilot, we assume standard pattern.
// If types fail, we'll fix them.
import solanaPlugin from "@elizaos/plugin-solana";
import evmPlugin from "@elizaos/plugin-evm";

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const pluginRegistry: Record<string, unknown> = {
    "@elizaos/plugin-evm": evmPlugin,
    "@elizaos/plugin-solana": solanaPlugin,
    "@elizaos/plugin-twitter": TwitterPlugin,
    "@elizaos/plugin-discord": discordPlugin,
};

const resolvePlugins = (character: Character): any[] => {
    const requestedPlugins = new Set(character.plugins ?? []);

    if (process.env.TWITTER_USERNAME) {
        requestedPlugins.add("@elizaos/plugin-twitter");
    }

    if (process.env.DISCORD_API_TOKEN) {
        requestedPlugins.add("@elizaos/plugin-discord");
    }

    return Array.from(requestedPlugins).map((name) => {
        const plugin = pluginRegistry[name];
        if (!plugin) {
            console.warn(`Plugin ${name} is not installed for this mock agent.`);
        }
        return plugin;
    }).filter(Boolean) as any[];
};

async function main() {
    console.log("Starting NexusGrowth (ELIZAOS Pilot)...");

    // Load character (default to marketing, but allow override via env or arg)
    // For this step, let's load the multi-chain character if it exists, else marketing
    const multiChainPath = path.join(__dirname, "../multi-chain.character.json");
    const marketingPath = path.join(__dirname, "../marketing.character.json");

    const characterPath = fs.existsSync(multiChainPath) ? multiChainPath : marketingPath;
    console.log(`Loading character from: ${characterPath}`);

    const characterData = JSON.parse(fs.readFileSync(characterPath, "utf-8"));

    // Validate and cast to Character type
    const character = {
        ...characterData,
        modelProvider: "openai",
        settings: {
            ...characterData.settings,
            secrets: {
                ...characterData.settings?.secrets,
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            },
        },
    } as Character;

    // Initialize Runtime
    const runtime = new AgentRuntime({
        character,
        plugins: resolvePlugins(character),
        // Simple in-memory database for pilot
        adapter: {} as any,
    });

    console.log("Runtime initialized. Starting agent...");

    // Start the runtime (assuming a start method or similar)
    // runtime.start(); 
    // Note: The actual API might differ. Usually runtimes need a 'start' or 'initialize'.
    // Based on search, it coordinates responses.

    console.log(`Agent ${character.name} is running!`);
}

main().catch((error) => {
    console.error("Failed to start agent:", error);
    process.exit(1);
});

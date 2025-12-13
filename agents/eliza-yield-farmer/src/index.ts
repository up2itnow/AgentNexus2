import { AgentRuntime, Character } from "@elizaos/core";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import evmPlugin from "@elizaos/plugin-evm";
import solanaPlugin from "@elizaos/plugin-solana";

dotenv.config();

const pluginRegistry: Record<string, unknown> = {
    "@elizaos/plugin-evm": evmPlugin,
    "@elizaos/plugin-solana": solanaPlugin,
};

const resolvePlugins = (character: Character): any[] =>
    (character.plugins ?? []).map((name) => {
        const plugin = pluginRegistry[name];
        if (!plugin) {
            console.warn(`Plugin ${name} is not installed for this mock agent.`);
        }
        return plugin;
    }).filter(Boolean) as any[];

async function main() {
    console.log("Starting NexusFarmer (ELIZAOS Yield Agent)...");

    // Load character
    const characterPath = path.join(__dirname, "../farmer.character.json");
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
        adapter: {} as any,
    });

    console.log("NexusFarmer initialized. Ready to harvest.");
}

main().catch((error) => {
    console.error("Failed to start agent:", error);
    process.exit(1);
});

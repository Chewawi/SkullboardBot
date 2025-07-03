import { eq } from 'drizzle-orm';

import { schema, db } from './index';

export const skullboard = schema.skullboard;
export const skullboardConfig = schema.skullboardConfig;

/**
 * Retrieves the Skullboard configuration for a specific guild.
 * If no configuration exists, returns a default configuration.
 * @param guildId - The ID of the guild to retrieve the configuration for.
 */
export async function getSkullboardConfig(guildId: string) {
    const result = await db.select().from(skullboardConfig).where(eq(skullboardConfig.guildId, guildId));
    const config = result.at(0);

    // Return default configuration if none exists in the database
    if (!config) {
        return {
            guildId,
            skullboardChannelId: null,
            minSkulls: 4
        };
    }

    return config;
}

/**
 * Updates or inserts the Skullboard configuration for a specific guild.
 * @param guildId - The ID of the guild to update the configuration for.
 * @param skullboardChannelId - The ID of the Skullboard channel.
 * @param minSkulls - The minimum number of skull reactions required.
 */
export async function setSkullboardConfig(guildId: string, skullboardChannelId: string, minSkulls: number) {
    const result = await db.select().from(skullboardConfig).where(eq(skullboardConfig.guildId, guildId));
    const existingConfig = result.at(0);

    if (existingConfig) {
        // Update existing configuration
        await db.update(skullboardConfig)
            .set({
                skullboardChannelId,
                minSkulls
            })
            .where(eq(skullboardConfig.guildId, guildId));
    } else {
        // Insert new configuration
        await db.insert(skullboardConfig).values({
            guildId,
            skullboardChannelId,
            minSkulls
        });
    }
}

/**
 * Saves a new message to the Skullboard database.
 * @param data - The message data to save.
 */
export async function saveSkullboardMessage(data: {
    messageId: string;
    channelId: string;
    userId: string;
    skullsCount: number;
    skullboardMessageId: string | null;
}) {
    await db.insert(skullboard).values(data);
}

/**
 * Updates the number of skull reactions for a specific message.
 * @param messageId - The ID of the message to update.
 * @param skullsCount - The updated count of skull reactions.
 */
export async function updateSkullsCount(messageId: string, skullsCount: number) {
    await db.update(skullboard)
        .set({ skullsCount })
        .where(eq(skullboard.messageId, messageId));
}

/**
 * Retrieves a message from the Skullboard database.
 * @param messageId - The ID of the message to retrieve.
 */
export async function getSkullboardMessage(messageId: string) {
    const result = await db.select().from(skullboard).where(eq(skullboard.messageId, messageId));
    return result.at(0) ?? null;
}

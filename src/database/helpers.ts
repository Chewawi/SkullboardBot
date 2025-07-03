import { eq } from 'drizzle-orm';
import { Logger } from 'seyfert';

import { schema, db } from './index';

export const skullboard = schema.skullboard;
export const skullboardConfig = schema.skullboardConfig;

const LOGGER = new Logger({ name: 'database' });
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
    try {
        await db.insert(skullboard).values(data);
        LOGGER.info(`Successfully saved message ${data.messageId} to skullboard database`);
    } catch (error) {
        LOGGER.error(`Error saving message ${data.messageId} to skullboard database:`, error);

        // If the message already exists, try to update it instead
        try {
            await db.update(skullboard)
                .set({
                    channelId: data.channelId,
                    userId: data.userId,
                    skullsCount: data.skullsCount,
                    skullboardMessageId: data.skullboardMessageId
                })
                .where(eq(skullboard.messageId, data.messageId));
            LOGGER.info(`Updated existing message ${data.messageId} in skullboard database`);
        } catch (updateError) {
            LOGGER.error(`Error updating message ${data.messageId} in skullboard database:`, updateError);
        }
    }
}

/**
 * Updates the number of skull reactions for a specific message.
 * @param messageId - The ID of the message to update.
 * @param skullsCount - The updated count of skull reactions.
 */
export async function updateSkullsCount(messageId: string, skullsCount: number) {
    try {
        const result = await db.update(skullboard)
            .set({ skullsCount })
            .where(eq(skullboard.messageId, messageId))
            .returning();

        LOGGER.info(`Updated skulls count for message ${messageId} to ${skullsCount}`);

        // If no rows were affected, the message might not exist in the database yet
        if (result.length <= 0) {
            LOGGER.warn(`No message found with ID ${messageId} to update skulls count`);
        }
    } catch (error) {
        LOGGER.error(`Error updating skulls count for message ${messageId}:`, error);
    }
}

/**
 * Retrieves a message from the Skullboard database.
 * @param messageId - The ID of the message to retrieve.
 */
export async function getSkullboardMessage(messageId: string) {
    try {
        const result = await db.select().from(skullboard).where(eq(skullboard.messageId, messageId));
        const message = result.at(0) ?? null;

        if (message) {
            LOGGER.info(`Retrieved message ${messageId} from skullboard database`);
        } else {
            LOGGER.info(`No message found with ID ${messageId} in skullboard database`);
        }

        return message;
    } catch (error) {
        LOGGER.error(`Error retrieving message ${messageId} from skullboard database:`, error);
        return null;
    }
}

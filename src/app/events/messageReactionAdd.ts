import { createEvent, Logger } from 'seyfert';

import { getSkullboardMessage, getSkullboardConfig, updateSkullsCount } from '~/database/helpers';
import { createNewSkullboardMessage, createButtons } from '~/core/utils';

const LOGGER = new Logger({ name: 'messageReactionAdd' });

export default createEvent({
    data: { name: 'messageReactionAdd' },
    async run(reaction, client) {
        try {
            LOGGER.info(`Processing reaction add event for message ${reaction.messageId}`);

            if (reaction.emoji.user?.bot) {
                return;
            }

            const { messageId, guildId } = reaction;
            if (!guildId) {
                LOGGER.info('Skipping reaction: No guild ID');
                return;
            }

            const config = await getSkullboardConfig(guildId);
            if (!config.skullboardChannelId || reaction.emoji.name !== '💀') {
                LOGGER.info(`Skipping reaction: No skullboard channel configured or not a skull emoji (${reaction.emoji.name || ''})`);
                return;
            }

            LOGGER.info(`Fetching skullboard channel ${config.skullboardChannelId}`);
            const skullboardChannel = await client.channels.fetch(config.skullboardChannelId);
            if (!skullboardChannel.isTextGuild()) {
                LOGGER.info('Skipping reaction: Skullboard channel is not a text channel');
                return;
            }

            LOGGER.info(`Fetching message ${reaction.messageId} from channel ${reaction.channelId}`);
            const message = await client.messages.fetch(reaction.messageId, reaction.channelId);
            const existingMessage = await getSkullboardMessage(messageId);

            // For new messages, the reactions array might not be properly populated
            // If this is a skull reaction event, we know there's at least one skull
            let skullsCount = message.reactions?.find((e) => e.emoji.name === '💀')?.count || 0;

            // If we're processing a skull reaction but count is 0, set it to at least 1
            if (skullsCount === 0) {
                LOGGER.info('Detected skull reaction event but count is 0, setting to 1');
                skullsCount = 1;
            }

            LOGGER.info(`Message ${messageId} has ${skullsCount} skull reactions`);

            if (existingMessage) {
                LOGGER.info(`Found existing skullboard entry for message ${messageId}`);
                // Update existing skullboard message
                if (skullsCount !== existingMessage.skullsCount) {
                    LOGGER.info(`Skulls count changed from ${existingMessage.skullsCount} to ${skullsCount}`);
                    if (existingMessage.skullboardMessageId) {
                        LOGGER.info(`Fetching skullboard message ${existingMessage.skullboardMessageId}`);
                        const skullboardMessage = await skullboardChannel.messages.fetch(existingMessage.skullboardMessageId).catch((error: unknown) => {
                            LOGGER.error(`Error fetching skullboard message ${existingMessage.skullboardMessageId || ''}:`, error);
                            return null;
                        });

                        if (skullboardMessage) {
                            LOGGER.info(`Updating skullboard message ${existingMessage.skullboardMessageId}`);
                            const buttons = createButtons(message, guildId, skullsCount);
                            await skullboardMessage.edit({
                                components: [buttons]
                            });
                            await updateSkullsCount(messageId, skullsCount);
                            // If skullboard message is deleted, create a new one if threshold is met
                        } else if (skullsCount >= config.minSkulls) {
                            LOGGER.info('Skullboard message was deleted, creating a new one');
                            await createNewSkullboardMessage(skullboardChannel, message, guildId, skullsCount);
                        }
                    }
                }
                // Create new skullboard message if conditions met
            } else {
                LOGGER.info(`No existing skullboard entry for message ${messageId}`);
                if (skullsCount >= config.minSkulls) {
                    LOGGER.info(`Creating new skullboard entry for message ${messageId} with ${skullsCount} skulls`);
                    await createNewSkullboardMessage(skullboardChannel, message, guildId, skullsCount);
                } else {
                    LOGGER.info(`Not creating skullboard entry: ${skullsCount} skulls is below threshold of ${config.minSkulls}`);
                }
            }
        } catch (error) {
            LOGGER.error('Error processing reaction add event:', error);
        }
    }
});

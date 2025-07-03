import { createEvent, Logger } from 'seyfert';

import { getSkullboardMessage, getSkullboardConfig, updateSkullsCount } from '~/database/helpers';
import { createButtons } from '~/core/utils';

const LOGGER = new Logger({ name: 'messageReactionRemove' });

export default createEvent({
    data: { name: 'messageReactionRemove' },
    async run(reaction, client) {
        try {
            LOGGER.info(`Processing reaction remove event for message ${reaction.messageId}`);

            const { messageId, guildId } = reaction;
            if (!guildId || reaction.emoji.name !== '💀') {
                LOGGER.info(`Skipping reaction remove: No guild ID or not a skull emoji (${reaction.emoji.name || ''})`);
                return;
            }

            const config = await getSkullboardConfig(guildId);
            if (!config.skullboardChannelId) {
                LOGGER.info('Skipping reaction remove: No skullboard channel configured');
                return;
            }

            LOGGER.info(`Fetching skullboard channel ${config.skullboardChannelId}`);
            const skullboardChannel = await client.channels.fetch(config.skullboardChannelId);
            if (!skullboardChannel.isTextGuild()) {
                LOGGER.info('Skipping reaction remove: Skullboard channel is not a text channel');
                return;
            }

            LOGGER.info(`Fetching message ${reaction.messageId} from channel ${reaction.channelId}`);
            const message = await client.messages.fetch(reaction.messageId, reaction.channelId);

            const skullsCount = message.reactions?.find((e) => e.emoji.name === '💀')?.count || 0;
            LOGGER.info(`Message ${messageId} now has ${skullsCount} skull reactions after removal`);

            await updateSkullsCount(messageId, skullsCount);

            const existingMessage = await getSkullboardMessage(messageId);
            if (existingMessage) {
                LOGGER.info(`Found existing skullboard entry for message ${messageId}`);

                if (!existingMessage.skullboardMessageId) {
                    LOGGER.info(`Skipping: No skullboard message ID found for message ${messageId}`);
                    return;
                }

                if (skullsCount < config.minSkulls) {
                    LOGGER.info(`Skulls count ${skullsCount} is below threshold ${config.minSkulls}, deleting skullboard message`);
                    // Delete skullboard message if below threshold
                    try {
                        const skullboardMessage = await skullboardChannel.messages.fetch(existingMessage.skullboardMessageId);
                        await skullboardMessage.delete();
                        LOGGER.info(`Deleted skullboard message ${existingMessage.skullboardMessageId}`);
                    } catch (error) {
                        LOGGER.error(`Error deleting skullboard message ${existingMessage.skullboardMessageId}:`, error);
                    }
                } else {
                    LOGGER.info(`Skulls count ${skullsCount} is still above threshold ${config.minSkulls}, updating skullboard message`);
                    // Update skull count if still above threshold
                    try {
                        const skullboardMessage = await skullboardChannel.messages.fetch(existingMessage.skullboardMessageId);
                        const buttons = createButtons(message, guildId, skullsCount);
                        await skullboardMessage.edit({
                            components: [buttons]
                        });
                        LOGGER.info(`Updated skullboard message ${existingMessage.skullboardMessageId}`);
                    } catch (error) {
                        LOGGER.error(`Error updating skullboard message ${existingMessage.skullboardMessageId}:`, error);
                    }
                }
            } else {
                LOGGER.info(`No existing skullboard entry found for message ${messageId}`);
            }
        } catch (error) {
            LOGGER.error('Error processing reaction remove event:', error);
        }
    }
});

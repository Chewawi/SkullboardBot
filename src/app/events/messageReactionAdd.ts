import { createEvent } from 'seyfert';

import { getSkullboardMessage, getSkullboardConfig, updateSkullsCount } from '~/database/helpers';
import { createNewSkullboardMessage, createButtons } from '~/core/utils';

export default createEvent({
    data: { name: 'messageReactionAdd' },
    async run(reaction, client) {
        // Ignore bot reactions
        if (reaction.emoji.user?.bot) {
            return;
        }

        const { messageId, guildId } = reaction;
        if (!guildId) {
            return;
        }

        const config = await getSkullboardConfig(guildId);
        if (!config.skullboardChannelId || reaction.emoji.name !== '💀') {
            return;
        }

        const skullboardChannel = await client.channels.fetch(config.skullboardChannelId);
        if (!skullboardChannel.isTextGuild()) {
            return;
        }

        const message = await client.messages.fetch(reaction.messageId, reaction.channelId);
        const existingMessage = await getSkullboardMessage(messageId);

        const skullsCount = message.reactions?.find((e) => e.emoji.name === '💀')?.count || 0;

        if (existingMessage) {
            // Update existing skullboard message
            if (skullsCount !== existingMessage.skullsCount) {
                if (existingMessage.skullboardMessageId) {

                    const skullboardMessage = await skullboardChannel.messages.fetch(existingMessage.skullboardMessageId).catch(() => null);

                    if (skullboardMessage) {
                        const buttons = createButtons(message, guildId, skullsCount);
                        await skullboardMessage.edit({
                            components: [buttons]
                        });
                        await updateSkullsCount(messageId, skullsCount);
                        // If skullboard message is deleted, create a new one if threshold is met
                    } else if (skullsCount >= config.minSkulls) {
                        await createNewSkullboardMessage(skullboardChannel, message, guildId, skullsCount);
                    }
                }
            }
            // Create new skullboard message if conditions met
        } else
            if (skullsCount >= config.minSkulls) {
                await createNewSkullboardMessage(skullboardChannel, message, guildId, skullsCount);
            }
    }
});

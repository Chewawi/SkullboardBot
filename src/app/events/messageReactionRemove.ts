import { createEvent } from 'seyfert';
import { createButtons } from '~/core/utils';
import { getSkullboardConfig, getSkullboardMessage, updateSkullsCount } from '~/database/helpers';

export default createEvent({
    data: { name: "messageReactionRemove" },
    async run(reaction, client) {
        const { messageId, guildId } = reaction;
        if (!guildId || reaction.emoji.name !== "💀") return;

        const config = await getSkullboardConfig(guildId);
        if (!config.skullboardChannelId) return;

        const skullboardChannel = await client.channels.fetch(config.skullboardChannelId);
        if (!skullboardChannel?.isTextGuild()) return;


        const message = await client.messages.fetch(reaction.messageId, reaction.channelId);

        const skullsCount = (message?.reactions?.find((e) => e.emoji.name === "💀")?.count) || 0;
        await updateSkullsCount(messageId, skullsCount);

        const existingMessage = await getSkullboardMessage(messageId);
        if (existingMessage) {
            if (!existingMessage.skullboardMessageId) return;
            if (skullsCount < config.minSkulls) {
                // Delete skullboard message if below threshold
                const skullboardMessage = await skullboardChannel.messages.fetch(existingMessage.skullboardMessageId);

                if (skullboardMessage) await skullboardMessage.delete();
            } else {
                // Update skull count if still above threshold
                const skullboardMessage = await skullboardChannel.messages.fetch(existingMessage.skullboardMessageId);
                if (skullboardMessage) {
                    const buttons = createButtons(message, skullsCount);
                    await skullboardMessage.edit({
                        components: [buttons],
                    });
                }
            }
        }
    },
});

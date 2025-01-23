import { createEvent } from "seyfert";
import { createButtons, createNewSkullboardMessage } from "~/core/utils";
import { getSkullboardConfig, getSkullboardMessage, updateSkullsCount } from "~/database/helpers";

export default createEvent({
    data: { name: "messageReactionAdd" },
    async run(reaction, client) {
        // Ignore bot reactions
        if (reaction.emoji.user?.bot) return;

        const { messageId, guildId } = reaction;
        if (!guildId) return;

        const config = await getSkullboardConfig(guildId);
        if (!config.skullboardChannelId || reaction.emoji.name !== "💀") return;

        const skullboardChannel = await client.channels.fetch(config.skullboardChannelId);
        if (!skullboardChannel?.isTextGuild()) return;

        const message = await client.messages.fetch(reaction.messageId, reaction.channelId);
        const existingMessage = await getSkullboardMessage(messageId);

        const skullsCount = (message?.reactions?.find((e) => e.emoji.name === "💀")?.count) || 0;

        if (existingMessage) {
            // Update existing skullboard message
            if (skullsCount !== existingMessage.skullsCount) {
                if (existingMessage.skullboardMessageId) {

                    const skullboardMessage = await skullboardChannel.messages.fetch(existingMessage.skullboardMessageId).catch(() => null);

                    if (skullboardMessage) {
                        const buttons = createButtons(message, skullsCount);
                        await skullboardMessage.edit({
                            components: [buttons],
                        });
                        await updateSkullsCount(messageId, skullsCount);
                    } else {
                        // If skullboard message is deleted, create a new one if threshold is met
                        if (skullsCount >= config.minSkulls) {
                            await createNewSkullboardMessage(skullboardChannel, message, skullsCount);
                        }
                    }
                }
            }
        } else {
            // Create new skullboard message if conditions met
            if (skullsCount >= config.minSkulls) {
                await createNewSkullboardMessage(skullboardChannel, message, skullsCount);
            }
        }
    },
});
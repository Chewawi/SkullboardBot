import { ActionRow, Button, Message, TextGuildChannel } from "seyfert";
import { APIEmbed, ButtonStyle } from "seyfert/lib/types";
import { saveSkullboardMessage } from "~/database/helpers";

/**
 * Creates a new skullboard message with the provided data.
 * @param skullboardChannel - The channel to send the skullboard message.
 * @param message - The message to base the skullboard message on.
 * @param skullsCount - The initial count of skull reactions.
 */
export async function createNewSkullboardMessage(skullboardChannel: TextGuildChannel, message: Message, skullsCount: number) {
    const embed: APIEmbed = {
        color: 0x2B2D31,

        author: {
            name: message.author.tag,
            icon_url: message.author.avatarURL(),
        },

        description: message.content || "_ _",

        ...(message.attachments.length > 0 && {
            image: { url: message.attachments[0]?.url || "" },
        }),

        timestamp: message.createdAt.toISOString(),
    };

    const buttons = createButtons(message, skullsCount);

    const skullboardMessage = await skullboardChannel.messages.write({ embeds: [embed], components: [buttons] });
    await saveSkullboardMessage({
        messageId: message.id,
        channelId: message.channelId,
        userId: message.author.id,
        skullsCount,
        skullboardMessageId: skullboardMessage.id,
    });
}

/**
 * Creates a set of buttons for the skullboard message.
 * @param message - The message to base the buttons on.
 * @param skullsCount - The current count of skull reactions.
 * @returns The ActionRow with the buttons.
 */
export function createButtons(message: Message, skullsCount: number) {
    return new ActionRow().addComponents(
        new Button()
            .setCustomId("skulls_count")
            .setLabel(`${skullsCount}`)
            .setEmoji("💀")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new Button()
            .setLabel("Jump to Message")
            .setStyle(ButtonStyle.Link)
            .setURL(message.url),
    );
}

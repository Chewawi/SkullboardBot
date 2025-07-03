import type { TextGuildChannel, Message } from 'seyfert';
import type { APIEmbed } from 'seyfert/lib/types';

import { ActionRow, Formatter, Button } from 'seyfert';
import { ButtonStyle } from 'seyfert/lib/types';
import { Logger } from 'seyfert';

import { saveSkullboardMessage } from '~/database/helpers';

const LOGGER = new Logger({ name: 'utils' });
/**
 * Creates a new skullboard message with the provided data.
 * @param skullboardChannel - The channel to send the skullboard message.
 * @param message - The message to base the skullboard message on.
 * @param guildId
 * @param skullsCount - The initial count of skull reactions.
 */
export async function createNewSkullboardMessage(skullboardChannel: TextGuildChannel, message: Message, guildId: string, skullsCount: number) {
    try {
        LOGGER.info(`Creating new skullboard message for message ${message.id} with ${skullsCount} skulls`);

        const embed: APIEmbed = {
            color: 0x2B2D31,

            author: {
                name: message.author.tag,
                icon_url: message.author.avatarURL()
            },

            description: message.content || '_ _',

            ...message.attachments.length > 0 && {
                image: { url: message.attachments[0]?.url || '' }
            },

            timestamp: message.createdAt.toISOString()
        };

        const buttons = createButtons(message, guildId, skullsCount);

        const skullboardMessage = await skullboardChannel.messages.write({
            embeds: [embed],
            components: [buttons]
        });

        LOGGER.info(`Successfully created skullboard message ${skullboardMessage.id} for message ${message.id}`);

        // Save the message to the database
        await saveSkullboardMessage({
            messageId: message.id,
            channelId: message.channelId,
            userId: message.author.id,
            skullsCount,
            skullboardMessageId: skullboardMessage.id
        });
    } catch (error) {
        LOGGER.error(`Error creating skullboard message for message ${message.id}:`, error);
    }
}

/**
 * Creates a set of buttons for the skullboard message.
 * @param message - The message to base the buttons on.
 * @param guildId - The ID of the guild where the message is located.
 * @param skullsCount - The current count of skull reactions.
 * @returns The ActionRow with the buttons.
 */
export function createButtons(message: Message, guildId: string, skullsCount: number) {
    return new ActionRow().addComponents(
        new Button()
            .setCustomId('skulls_count')
            .setLabel(`${skullsCount}`)
            .setEmoji('💀')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new Button()
            .setLabel('Jump to Message')
            .setStyle(ButtonStyle.Link)
            .setURL(Formatter.messageLink(guildId, message.channelId, message.id))
    );
}

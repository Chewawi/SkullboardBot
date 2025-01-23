import { Declare, CommandContext, Options, createChannelOption, createNumberOption, SubCommand } from 'seyfert';
import { MessageFlags } from 'seyfert/lib/types';
import { setSkullboardConfig } from '~/database/helpers';

const options = {
    channel: createChannelOption({
        description: 'Channel to send the skullboard message.',
        required: true,
    }),
    min_skulls: createNumberOption({
        description: 'Minimum skulls required for a message to be posted in the skullboard channel. (default: 4)',
        required: false,
        min_value: 1,
        max_value: 100,
    }),
};

@Declare({
    name: 'set',
    description: 'Set the skullboard configuration.',
})
@Options(options)
export default class SkullCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.guildId) return await ctx.editOrReply({
            content: 'This command can only be executed in a guild channel. :skull:',
            flags: MessageFlags.Ephemeral,
        });

        const channel = ctx.options.channel;
        const minSkulls = ctx.options.min_skulls || 4;

        await setSkullboardConfig(ctx.guildId, channel.id, minSkulls);

        return await ctx.editOrReply({
            content: `Skullboard configuration updated. Messages with at least \`${minSkulls}\` skulls will now be posted in ${channel}`,
        });
    }
}
import { Declare, Command, AutoLoad } from "seyfert";

@Declare({
    name: "skull",
    description: "Skullboard commands",
    defaultMemberPermissions: ['ManageGuild'],
    integrationTypes: ['GuildInstall'],
    contexts: ['Guild', 'PrivateChannel'],
})
@AutoLoad()
export default class SkullParent extends Command { }
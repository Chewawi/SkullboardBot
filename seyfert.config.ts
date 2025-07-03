import { config } from "seyfert";

export default config.bot({
    token: process.env.BOT_TOKEN ?? "",
    locations: {
        base: "src",
        commands: "app/commands",
        events: "app/events",
    },
    intents: ["Guilds", "MessageContent", "GuildMessageReactions", "GuildMessages"],
});
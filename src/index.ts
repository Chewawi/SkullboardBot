import { Client } from "seyfert";

const client = new Client();

await client.start();
await client.uploadCommands()
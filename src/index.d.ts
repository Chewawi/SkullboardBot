import type { WorkerClient, ParseClient, HttpClient, Client } from 'seyfert';

declare module 'seyfert' {
    interface UsingClient extends ParseClient<Client<true>> { }

    interface UsingClient extends ParseClient<HttpClient> { }

    interface UsingClient extends ParseClient<WorkerClient<true>> { }
}

import { Server } from "https://deno.land/x/allo_server/mod.ts";
import { ControllerManager } from "../libs/ControllerManager.ts";
import { RouterList } from "../libs/RouterList.ts";


const manager = new ControllerManager("./dummy");
const router = new RouterList(manager);
const server = new Server(router);


server.listen({
    port: 8080,
});

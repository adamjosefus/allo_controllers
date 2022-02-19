import { join } from "https://deno.land/std@0.126.0/path/mod.ts";
import { Server } from "https://deno.land/x/allo_server@v1.0.0-beta/mod.ts";
import { ControllerManager } from "../libs/ControllerManager.ts";
import { RouterList } from "../libs/RouterList.ts";

const path = join(Deno.cwd(), "./dummy");
const manager = new ControllerManager(path);

const router = new RouterList(manager);
router.add("", () => {
    return new Response("Hello World!");
});

router.addController("homepage/default", "Homepage:default");

const server = new Server(router);

server.listen({
    port: 8080,
});


console.log("http://localhost:8080");

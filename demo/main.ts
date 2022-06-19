/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { join } from "../libs/path.ts";
import { Server } from "../libs/allo_server.ts";
import { ControllerManager } from "../model/ControllerManager.ts";
import { RouterList } from "../model/RouterList.ts";


class DummyDependency {
    constructor() {
    }
}


const dummyDependency = new DummyDependency();


const controllerDir = join(Deno.cwd(), "./demo/controllers");
const manager = new ControllerManager(controllerDir);
manager.addDependency("dummyDependency", dummyDependency);


const router = new RouterList(manager);
router.setError((_req, params) => {
    console.error(params);
    
    return new Response(JSON.stringify(params));
});

router.addController("[[<controller>/]<action>]", "Homepage:default");


const port = 8080;
const server = new Server(router);
server.listen({ port });
console.log(`http://localhost:${port}`);

/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { assertEquals } from "https://deno.land/std@0.126.0/testing/asserts.ts";
import { join } from "https://deno.land/std@0.126.0/path/mod.ts";
import { Server } from "https://deno.land/x/allo_server@v1.0.1/mod.ts";
import { ControllerManager } from "../libs/ControllerManager.ts";
import { RouterList } from "../libs/RouterList.ts";



class DummyDependency {
    constructor() {
    }
}


const dummyDependency = new DummyDependency();


const controllerDir = join(Deno.cwd(), "./tests/controllers");
const manager = new ControllerManager(controllerDir);
manager.addDependency(dummyDependency);


const router = new RouterList(manager);
router.add("", () => new Response("Hello World!"));
router.addController("homepage/default[/<id>]", "Homepage:default");


const server = new Server(router);
server.listen({ port: 8080 });

console.log("http://localhost:8080");
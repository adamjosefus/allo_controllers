/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Cache } from "https://deno.land/x/allo_caching@v1.0.2/mod.ts";
import { Controller as AbstractController } from "./Controller.ts";
import { ControllerLifeCycle } from "./ControllerLifeCycle%20.ts";
import { ControllerLoader } from "./ControllerLoader.ts";


class Controller extends AbstractController { }



export class ControllerManager {

    readonly #loader: ControllerLoader;
    readonly #callerCache: Cache<ControllerLifeCycle> = new Cache();

    readonly defaultControllerFallback = 'Homepage';
    readonly defaultActionFallback = 'default';


    constructor(dir: string) {
        this.#loader = new ControllerLoader(dir);
    }


    #parseMeta(meta: string) {
        const [controller, action] = meta.split(":");

        // TODO: check case

        return {
            controller: firstUpper(controller),
            action: firstLower(action),
        };
    }


    async createResponse(meta: string, req: Request, params: Record<string, string>): Promise<Response> {
        const metaParts = this.#parseMeta(meta);

        const controllerName = params['controller'] ?? metaParts.controller;
        const action = params['action'] ?? metaParts.action;

        const controller = await this.#loader.createInstanceObject(controllerName, req);

        const lifeCycle = this.#callerCache.load(meta, () => new ControllerLifeCycle(controller));

        return lifeCycle.call(di, controller, action, params);

    }
}

/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Cache } from "./libs/allo_caching.ts";
import { ControllerLifeCycle } from "./ControllerLifeCycle.ts";
import { ControllerLoader } from "./ControllerLoader.ts";
import { DIContainer } from "./DIContainer.ts";
import { Case } from "./helper/Case.ts";


type MetaType = {
    controller: string,
    action: string,
}


export class ControllerManager {

    readonly #loader: ControllerLoader;
    readonly #di: DIContainer;

    readonly #callerCache: Cache<ControllerLifeCycle> = new Cache();
    readonly #metaCache: Cache<MetaType> = new Cache();
    readonly #paramControllerCache: Cache<string> = new Cache();
    readonly #paramActionCache: Cache<string> = new Cache();

    readonly defaultControllerFallback = 'Homepage';
    readonly defaultActionFallback = 'default';


    constructor(dir: string) {
        this.#loader = new ControllerLoader(dir);
        this.#di = new DIContainer()
    }


    // deno-lint-ignore ban-types
    addDependency(name: string, instance: Object) {
        this.#di.add(name, instance);
    }


    async createResponse(meta: string, req: Request, params: Record<string, string>): Promise<Response> {
        const pointer = this.#parseMeta(meta);
        const paramMap = new Map(Object.entries(params));

        const controller = ((s) => {
            if (s) return this.#paramControllerCache.load(s, () => Case.kebabToPascal(s));
            else return pointer.controller;
        })(paramMap.get('controller'));

        const action = ((s) => {
            if (s) return this.#paramActionCache.load(s, () => Case.kebabToCamel(s));
            else return pointer.action;
        })(paramMap.get('action'));

        const instance = await this.#loader.createInstanceObject(req, controller, action, params);

        const lifeCycle = this.#callerCache.load(meta, () => new ControllerLifeCycle(instance));
        return lifeCycle.call(this.#di, instance, action, params);
    }


    #parseMeta(meta: string) {
        return this.#metaCache.load(meta, () => {
            const [controller, action] = meta.split(":");

            if (!Case.isPascal(controller)) {
                throw new Error(`Invalid controller name: ${controller}. Case must be Pascal`);
            }

            if (!Case.isCamal(action)) {
                throw new Error(`Invalid action name: ${action}. Case must be Camal`);
            }

            return {
                controller,
                action,
            };
        });
    }
}

/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Cache } from "https://deno.land/x/allo_caching@v1.0.2/mod.ts";
import { firstLower, firstUpper } from "./helper/changeCase.ts";
import { Controller as AbstractController } from "./Controller.ts";
import { ControllerExit } from "./ControllerExit.ts";


// type Promisable<T> = T | Promise<T>;
// type ExitType = Promisable<Response | Deno.FsFile | File | string | number | void | unknown>;

type InjectMethodType<instanceObject = unknown> = (instance: instanceObject) => void;
type StartupMethodType = () => void | Promise<void>;
type ViewActionMethodType = () => void | Promise<void>;
type BeforeRenderMethodType = () => void | Promise<void>;
type ViewRenderMethodType = () => void | Promise<void>;


type ControllerMethodsType = {
    startup?: StartupMethodType,
    inject: Map<string, InjectMethodType>,
    action: Map<string, ViewActionMethodType>,
    beforeRender?: BeforeRenderMethodType,
    render: Map<string, ViewRenderMethodType>,
}

const classSuffix = "Controller";

const regex = {
    className: new RegExp(`^[A-Z][a-zA-Z0-9]*${classSuffix}$`),
    magicMethod: /^(?<type>inject|action|render)(?<name>[A-Z][a-zA-Z0-9]*)$/,
}


class Controller extends AbstractController { }


export class ControllerManager {
    #dir: string;

    readonly #classCache: Cache<{ new(): Controller }> = new Cache();
    readonly #methodsCache: Cache<ControllerMethodsType> = new Cache();

    readonly defaultControllerFallback = 'Homepage';
    readonly defaultActionFallback = 'default';


    constructor(dir: string) {
        this.#dir = dir;
    }


    #computeClassName(name: string): string {
        return `${name}Controller`;
    }


    #computePath(name: string): string {
        const className = this.#computeClassName(name);
        return `${this.#dir}/${className}.ts`;
    }


    async #importClassObject(name: string): Promise<{ new(): Controller }> {
        const className = this.#computeClassName(name);
        const path = this.#computePath(name);
        const module = await import(path);

        const classObject = module[className] as { new(): Controller };

        return classObject;
    }


    async #getClassObject(name: string): Promise<typeof Controller> {
        // Load from cache
        const cacheKey = name;

        if (this.#classCache.has(cacheKey)) {
            return this.#classCache.load(cacheKey)!;
        }

        // Load from file
        const classObject = await this.#importClassObject(name);

        // Save to cache
        this.#classCache.save(cacheKey, classObject);

        return classObject;
    }


    async #hasClassObject(name: string): Promise<boolean> {
        try {
            await this.#getClassObject(name);
            return true;

        } catch (_error) {
            return false;
        }
    }


    #parseMethods(controller: Controller): ControllerMethodsType {
        const controllerAsAny = controller as any;

        console.log("controllerAsAny", controllerAsAny);


        const methods: ControllerMethodsType = {
            inject: new Map(),
            action: new Map(),
            render: new Map(),
        };

        // deno-lint-ignore no-explicit-any
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controllerAsAny)).filter(property => typeof (controllerAsAny as any)[property] === "function");

        methodNames.forEach(methodName => {
            const fce = controllerAsAny[methodName];

            switch (methodName) {
                case "startup": methods.startup = fce; return;
                case "beforeRender": methods.beforeRender = fce; return;
            }

            regex.magicMethod.lastIndex = 0;
            const match = regex.magicMethod.exec(methodName);

            if (!match || !match.groups) return;

            const type = match.groups.type;
            const name = firstLower(match.groups.name);

            switch (type) {
                case "inject": methods.inject.set(name, fce); return;
                case "action": methods.action.set(name, fce); return;
                case "render": methods.render.set(name, fce); return;
            }
        });

        return methods;
    }


    async #createInstance(name: string, request: Request): Promise<Controller> {
        const classObject = await this.#getClassObject(name);
        const instance = new classObject(request);

        return instance;
    }


    // async #matchController(controller: string): Promise<boolean> {
    //     return await this.#hasClassObject(controller)
    // }


    // async #matchView(controller: string, view: string): Promise<boolean> {
    //     const instance = await this.#createInstance(controller);
    //     const methods = this.#parseMethods(instance);

    //     const hasAction = methods.action.get(view) !== undefined;
    //     const hasRender = methods.render.get(view) !== undefined;

    //     return hasAction || hasRender;
    // }


    #parseMeta(meta: string) {
        const [controller, view] = meta.split(":");

        return {
            controller: firstUpper(controller),
            view: firstLower(view),
        };
    }


    async createResponse(meta: string, req: Request, params: Record<string, string>): Promise<Response> {
        const { controller, view } = this.#parseMeta(meta);

        const instance = await this.#createInstance(controller, req);
        console.log("> instance", instance);

        const methods = this.#parseMethods(instance);

        try {
            // TODO: call inject methods

            if (methods.startup) {
                await methods.startup();
            }

            // TODO: build arguments

            if (methods.action.has(view)) {
                methods.action.get(view)!();
            }

            if (methods.beforeRender) {
                await methods.beforeRender();
            }

            if (methods.render.has(view)) {
                methods.render.get(view)!();
            }
        } catch (error) {
            console.log("> A");
            console.log(error);


            if (!(error instanceof ControllerExit)) throw new error;
            console.log("> B");

            const exit = error as ControllerExit;
            const exitValue = exit.getValue();

            if (exitValue instanceof Response) {
                return exitValue;
            }

            console.log("Unknown exit value", exitValue);
            throw new Error("Unknown exit value");

        }

        throw new Error("View not found");
    }
}
/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Cache } from "https://deno.land/x/allo_caching@v1.0.2/mod.ts";
import { firstLower, firstUpper } from "./helper/changeCase.ts";
import { ControllerExit } from "./ControllerExit.ts";
import { Controller as AbstractController } from "./Controller.ts";


class Controller extends AbstractController { }


type InjectMethodType<InjectedObject = unknown> = (instance: InjectedObject) => void;
type StartupMethodType = () => void | Promise<void>;
type ShutdownMethodType = () => void | Promise<void>;
type BeforeRenderMethodType = () => void | Promise<void>;
type ViewActionMethodType = (params: Record<string, string>) => void | Promise<void>;
type ViewRenderMethodType = (params: Record<string, string>) => void | Promise<void>;


// Methods Callers
// deno-lint-ignore no-explicit-any
type MethodCallerType<F extends (...args: any[]) => unknown> = (controller: Controller) => ReturnType<F>;

// deno-lint-ignore no-explicit-any
type MethodWithArgsCallerType<F extends (...args: any[]) => unknown, A extends unknown[]> = (controller: Controller, ...args: A) => ReturnType<F>;


type MethodSetType = {
    startup?: MethodCallerType<StartupMethodType>,
    shutdown?: MethodCallerType<ShutdownMethodType>,
    beforeRender?: MethodCallerType<BeforeRenderMethodType>,
    inject: Map<string, MethodWithArgsCallerType<InjectMethodType, [instance: unknown]>>,
    action: Map<string, MethodWithArgsCallerType<ViewActionMethodType, [Record<string, string>]>>,
    render: Map<string, MethodWithArgsCallerType<ViewRenderMethodType, [Record<string, string>]>>,
}


const classSuffix = "Controller";


export class ControllerManager {
    static readonly #regexp = {
        className: new RegExp(`^[A-Z][a-zA-Z0-9]*${classSuffix}$`),
        magicMethod: /^(?<type>inject|action|render)(?<name>[A-Z][a-zA-Z0-9]*)$/,
    }

    #dir: string;
    #dependecies: Map<string, unknown> = new Map();

    readonly #classCache: Cache<{ new(): Controller }> = new Cache();
    readonly #methodSetCache: Cache<MethodSetType> = new Cache();

    readonly defaultControllerFallback = 'Homepage';
    readonly defaultActionFallback = 'default';


    constructor(dir: string) {
        this.#dir = dir;
    }



    /**
     * If name is not given, it will be the class name.
     */
    // deno-lint-ignore ban-types
    addDependency(...entry: [name: string, instance: Object] | [instance: Object]): void {
        const [name, instance] = (() => {
            if (entry.length === 2) {
                return [firstLower(entry[0]), entry[1]];
            } else {
                return [firstLower(entry[0].constructor.name), entry[0]];
            }
        })();

        if (this.#dependecies.has(name)) {
            throw new Error(`Dependecy "${name}" already exists`);
        }

        this.#dependecies.set(name, instance);
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


    // async #hasClassObject(name: string): Promise<boolean> {
    //     try {
    //         await this.#getClassObject(name);
    //         return true;

    //     } catch (_error) {
    //         return false;
    //     }
    // }


    #createMethodSet(controller: Controller): MethodSetType {
        // TODO: This solution is realy stupid. Change it
        function createStartupCaller(method: string) {
            return (instance: Controller): ReturnType<StartupMethodType> => {
                // deno-lint-ignore no-explicit-any
                (instance as any)[method]();
            }
        }

        // TODO: This solution is realy stupid. Change it
        function createShutdownCaller(method: string) {
            return (instance: Controller): ReturnType<ShutdownMethodType> => {
                // deno-lint-ignore no-explicit-any
                (instance as any)[method]();
            }
        }

        // TODO: This solution is realy stupid. Change it
        function createBeforeRenderCaller(method: string) {
            return (instance: Controller): ReturnType<StartupMethodType> => {
                // deno-lint-ignore no-explicit-any
                (instance as any)[method]();
            }
        }

        // TODO: This solution is realy stupid. Change it
        function createInjectCaller(method: string) {
            return (instance: Controller, dependency: unknown): ReturnType<InjectMethodType> => {
                // deno-lint-ignore no-explicit-any
                (instance as any)[method](dependency);
            }
        }

        // TODO: This solution is realy stupid. Change it
        function createViewActionCaller(method: string) {
            return (instance: Controller, params: Record<string, string>): ReturnType<ViewActionMethodType> => {
                // deno-lint-ignore no-explicit-any
                (instance as any)[method](params);
            }
        }

        // TODO: This solution is realy stupid. Change it
        function createViewRenderCaller(method: string) {
            return (instance: Controller, params: Record<string, string>): ReturnType<ViewRenderMethodType> => {
                // deno-lint-ignore no-explicit-any
                (instance as any)[method](params);
            }
        }

        const createSet = (controller: Controller): MethodSetType => {
            const methodSet: MethodSetType = {
                startup: undefined,
                inject: new Map(),
                action: new Map(),
                beforeRender: undefined,
                render: new Map(),
            };

            // deno-lint-ignore no-explicit-any
            const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).filter(property => typeof (controller as any)[property] === "function");

            allMethods.forEach(method => {
                switch (method) {
                    case 'startup':
                        methodSet.startup = createStartupCaller(method);
                        return;

                    case 'shutdown':
                        methodSet.shutdown = createShutdownCaller(method);
                        return;

                    case 'beforeRender':
                        methodSet.beforeRender = createBeforeRenderCaller(method);
                        return;
                }

                const regex = ControllerManager.#regexp;
                regex.magicMethod.lastIndex = 0;
                const match = regex.magicMethod.exec(method);

                if (!match || !match.groups) return;

                const type = match.groups.type;
                const name = firstLower(match.groups.name);

                switch (type) {
                    case 'inject':
                        methodSet.inject.set(name, createInjectCaller(method));
                        return;

                    case 'action':
                        methodSet.action.set(name, createViewActionCaller(method));
                        return;

                    case 'render':
                        methodSet.render.set(name, createViewRenderCaller(method));
                        return;

                }
            });

            return methodSet;
        }

        return this.#methodSetCache.load(controller.constructor.name, () => createSet(controller));
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
        const methods = this.#createMethodSet(instance);

        try {
            // TODO: build arguments
            // TODO: call inject methods

            for (const [name, fce] of methods.inject) {
                console.log(">> inject", name);

                fce(instance, this.#dependecies.get(name));
            }


            if (methods.startup) {
                const fce = methods.startup;
                await fce(instance);
            }

            if (methods.action.has(view)) {
                const fce = methods.action.get(view)!;
                await fce(instance, params);
            }

            if (methods.beforeRender) {
                const fce = methods.beforeRender;
                await fce(instance);
            }

            if (methods.render.has(view)) {
                const fce = methods.render.get(view)!;
                await fce(instance, params);
            }

        } catch (error) {
            if (!(error instanceof ControllerExit)) throw new error;

            const exit = error as ControllerExit;
            const output = exit.getOutput();

            if (output instanceof Response) {
                return output;
            }

            console.log("Unknown exit output", output);
            throw new Error("Unknown exit output");
        }

        throw new Error("View not found");
    }
}

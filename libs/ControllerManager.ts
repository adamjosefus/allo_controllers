/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";


export class ChangeCase {
    static firstLower(str: string): string {
        return str.substring(0, 1).toLowerCase() + str.substring(1);
    }
}


type EndpointResultType = Promise<void | Response> | void | Response;

type InjectMethodType<instanceObject = unknown> = (instance: instanceObject) => void;
type StartupMethodType = () => EndpointResultType;
type ViewActionMethodType = () => EndpointResultType;
type BeforeRenderMethodType = () => void;
type ViewRenderMethodType = () => EndpointResultType;


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


export class ControllerManager {
    readonly defaultControllerFallback = 'Homepage';
    readonly defaultActionFallback = 'default';

    #dir: string;

    readonly #classCache: Map<string, { new(): Controller }> = new Map();
    readonly #methodsCache: Map<string, ControllerMethodsType> = new Map();



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
        const path = this.#computePath(name);
        const className = this.#computeClassName(name);

        const module = await import(path);
        const classObject = module[className] as { new(): Controller };

        return classObject;
    }


    async #getClassObject(name: string): Promise<{ new(): Controller }> {
        // Load from cache
        const cache = this.#classCache;
        const cacheKey = name;

        if (cache.has(cacheKey)) return cache.get(cacheKey)!;

        // Load from file
        const classObject = await this.#importClassObject(name);

        // Save to cache
        cache.set(cacheKey, classObject);

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
        // Load from cache
        const cache = this.#methodsCache;
        const cacheKey = controller.constructor.name;
        if (cache.has(cacheKey)) return cache.get(cacheKey)!;

        // Process
        const methods = this.#parseMethods_skipCache(controller);

        // Save to cache
        cache.set(cacheKey, methods);

        return methods;
    }


    #parseMethods_skipCache(controller: Controller): ControllerMethodsType {
        // deno-lint-ignore no-explicit-any
        const controllerAsAny = controller as any;

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
            const name = ChangeCase.firstLower(match.groups.name);

            switch (type) {
                case "inject": methods.inject.set(name, fce); return;
                case "action": methods.action.set(name, fce); return;
                case "render": methods.render.set(name, fce); return;
            }
        });

        return methods;
    }


    async #createInstance(name: string): Promise<Controller> {
        const classObject = await this.#getClassObject(name);
        const instance = new classObject();

        return instance;
    }


    async matchController(controller: string): Promise<boolean> {
        return await this.#hasClassObject(controller)
    }


    async matchView(controller: string, view: string): Promise<boolean> {
        const instance = await this.#createInstance(controller);
        const methods = this.#parseMethods(instance);

        const hasAction = methods.action.get(view) !== undefined;
        const hasRender = methods.render.get(view) !== undefined;

        return hasAction || hasRender;
    }


    async createViewResponse(controller: string, view: string): Promise<Response> {
        const instance = this.#createInstance(controller);
        const methods = this.#parseMethods(instance);

        // TODO: call inject methods

        if (methods.startup) {
            const result = await methods.startup();

            if (result instanceof Response) return result;
        }

        // TODO: build arguments
        const args = [];

        if (methods.action.has(view)) {
            const result = methods.action.get(view)!();

            if (result instanceof Response) return result;
        }


        if (methods.beforeRender) methods.beforeRender();


        if (methods.render.has(view)) {
            const result = methods.action.get(view)!();

            if (result instanceof Response) return result;
        }


        throw new Error("View not found");
    }
}
/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Cache } from "https://deno.land/x/allo_caching@v1.0.2/mod.ts";
import { Controller } from "./Controller.ts";
import { firstLower } from "./helper/changeCase.ts";


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
        const path = this.#computePath(name);
        const className = this.#computeClassName(name);

        const module = await import(path);
        const classObject = module[className] as { new(): Controller };

        return classObject;
    }


    async #getClassObject(name: string): Promise<{ new(): Controller }> {
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
        const parse = (controller: Controller): ControllerMethodsType => {
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
                const name = firstLower(match.groups.name);

                switch (type) {
                    case "inject": methods.inject.set(name, fce); return;
                    case "action": methods.action.set(name, fce); return;
                    case "render": methods.render.set(name, fce); return;
                }
            });

            return methods;
        }

        return this.#methodsCache.load(controller.constructor.name, () => {
            return parse(controller);
        });
    }


    async #createInstance(name: string): Promise<Controller> {
        const classObject = await this.#getClassObject(name);
        const instance = new classObject();

        return instance;
    }


    async #matchController(controller: string): Promise<boolean> {
        return await this.#hasClassObject(controller)
    }


    async #matchView(controller: string, view: string): Promise<boolean> {
        const instance = await this.#createInstance(controller);
        const methods = this.#parseMethods(instance);

        const hasAction = methods.action.get(view) !== undefined;
        const hasRender = methods.render.get(view) !== undefined;

        return hasAction || hasRender;
    }


    async createResponse(controller: string, view: string): Promise<Response> {
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
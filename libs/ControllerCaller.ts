/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";

type Promisable<T> = T | Promise<T>;

export type InjectMethodType<Injected = unknown> = (instance: Injected) => Promisable<void>;
export type CommonMethodType = () => Promisable<void>;
export type ViewMethodType = (params: Record<string, string>) => Promisable<void>;


// deno-lint-ignore no-explicit-any
type CallerType<T extends (...args: any) => any> = (controller: Controller, ...params: Parameters<T>) => ReturnType<T>;


export class ControllerCaller {
    readonly #regex = {
        magicMethod: /^(?<type>inject|action|render)(?<name>[A-Z][a-zA-Z0-9]*)$/,
    }


    constructor(instance: Controller) {
        const methodNames = this.#parseMethodNames(instance);
        
        this.#buildCommon();
    }


    #parseMethodNames(instance: Controller): readonly string[] {
        // deno-lint-ignore no-explicit-any
        return Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(property => typeof (instance as any)[property] === "function");
    }


    #buildCommon() {
        const startup: CallerType<CommonMethodType> = (c) => c.startup();
        const beforeRender: CallerType<CommonMethodType> = (c) => c.beforeRender();
        const afterRender: CallerType<CommonMethodType> = (c) => c.afterRender();
        const shutdown: CallerType<CommonMethodType> = (c) => c.shutdown();

        return {
            startup,
            beforeRender,
            afterRender,
            shutdown,
        };
    }


    #buildMagic(methodNames: readonly string[]) {
        const inject: Map<string, CallerType<InjectMethodType>> = new Map();
        const action: Map<string, CallerType<ViewMethodType>> = new Map();
        const render: Map<string, CallerType<ViewMethodType>> = new Map();

        methodNames.forEach(method => {
            this.#regex.magicMethod.lastIndex = 0;
            const match = this.#regex.magicMethod.exec(method);

            if (!match || !match.groups) return;

            const type = match.groups.type;
            const name = firstLower(match.groups.name);

            switch (type) {
                case 'inject':
                    // deno-lint-ignore no-explicit-any
                    inject.set(name, (c, injcted) => ((c as any)[method] as InjectMethodType)(injcted));
                    return;

                case 'action':
                    // deno-lint-ignore no-explicit-any
                    action.set(name, (c, params) => ((c as any)[method] as ViewMethodType)(params));
                    return;

                case 'render':
                    // deno-lint-ignore no-explicit-any
                    render.set(name, (c, params) => ((c as any)[method] as ViewMethodType)(params));
                    return;

            }
        });

        return {
            inject,
            action,
            render,
        }
    }
}
/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";
import { ControllerEvent } from "./ControllerEvent.ts";
import { ControllerLifeCycleExit } from "./ControllerLifeCycleExit.ts";
import { DIContainer } from "./DIContainer.ts";
import { Case } from "./helper/Case.ts";

type Promisable<T> = T | Promise<T>;

export type InjectMethodType<Injected = unknown> = (instance: Injected) => Promisable<void>;
export type CommonMethodType = () => Promisable<void>;
export type ViewMethodType = (params: Record<string, string>) => Promisable<void>;


// deno-lint-ignore no-explicit-any
type CallerType<T extends (...args: any) => any> = (controller: Controller, ...params: Parameters<T>) => ReturnType<T>;


export class ControllerLifeCycle {
    readonly #regex = {
        magicMethod: /^(?<type>inject|action|render)(?<name>[A-Z][a-zA-Z0-9]*)$/,
    }


    #startup: CallerType<CommonMethodType>;
    #beforeRender: CallerType<CommonMethodType>;
    #afterRender: CallerType<CommonMethodType>;
    #shutdown: CallerType<CommonMethodType>;

    #injects: Map<string, CallerType<InjectMethodType>>;
    #actions: Map<string, CallerType<ViewMethodType>>;
    #renders: Map<string, CallerType<ViewMethodType>>;


    constructor(controller: Controller) {
        const methodNames = this.#parseMethodNames(controller);

        const common = this.#buildCommon();
        const magic = this.#buildMagic(methodNames);

        this.#startup = common.startup;
        this.#beforeRender = common.beforeRender;
        this.#afterRender = common.afterRender;
        this.#shutdown = common.shutdown;

        this.#injects = magic.inject;
        this.#actions = magic.action;
        this.#renders = magic.render;
    }


    #parseMethodNames(controller: Controller): readonly string[] {
        // deno-lint-ignore no-explicit-any
        return Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).filter(property => typeof (controller as any)[property] === "function");
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

            if (!Case.isPascal(match.groups.name)) return;

            const name = Case.pascalToCamel(match.groups.name);
            const methodType = match.groups.type;

            switch (methodType) {
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


    async call(di: DIContainer, controller: Controller, action: string, params: Record<string, string>): Promise<Response> {
        try {
            // Inject
            for (const [name, method] of this.#injects) {
                await method(controller, di.get(name))
            }

            // Startup
            controller.dispatchEvent(new ControllerEvent('startup', controller));
            this.#startup(controller);

            // Action
            if (this.#actions.has(action)) {
                await this.#actions.get(action)!(controller, params);
            }

            const view = controller.getView();

            // Before render
            this.#beforeRender(controller);

            // Render
            // TODO: change action value to view value
            controller.dispatchEvent(new ControllerEvent('render', controller));

            if (this.#renders.has(view)) {
                await this.#renders.get(view)!(controller, params);
            }

            // After render
            this.#afterRender(controller);


        } catch (errorOrExit) {
            if (!(errorOrExit instanceof ControllerLifeCycleExit)) {
                // Retrow error
                const error = errorOrExit as Error;
                throw error;
            }

            controller.dispatchEvent(new ControllerEvent('shutdown', controller));
            this.#shutdown(controller);

            const exit = errorOrExit as ControllerLifeCycleExit;
            const reason = exit.getReason();

            if (reason instanceof Response) {
                return reason;
            }

            console.log("Unknown exit output", reason);
            throw new Error("Unknown exit output");
        }

        throw new Error("View not found");
    }
}

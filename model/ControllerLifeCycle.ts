/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";
import { ControllerExit, ControllerResponseExit } from "./ControllerExit.ts";
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

    #startupMethod: CallerType<CommonMethodType>;
    #beforeRenderMethod: CallerType<CommonMethodType>;
    #afterRenderMethod: CallerType<CommonMethodType>;
    #shutdownMethod: CallerType<CommonMethodType>;

    #injectMethods: Map<string, CallerType<InjectMethodType>>;
    #actionMethods: Map<string, CallerType<ViewMethodType>>;
    #renderMethods: Map<string, CallerType<ViewMethodType>>;


    constructor(controller: Controller) {
        const methodNames = this.#parseMethodNames(controller);

        const common = this.#buildCommon();
        const magic = this.#buildMagicMethods(methodNames);

        this.#startupMethod = common.startup;
        this.#beforeRenderMethod = common.beforeRender;
        this.#afterRenderMethod = common.afterRender;
        this.#shutdownMethod = common.shutdown;

        this.#injectMethods = magic.inject;
        this.#actionMethods = magic.action;
        this.#renderMethods = magic.render;
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


    #buildMagicMethods(methodNames: readonly string[]) {
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


    #createMethodCallbacks(di: DIContainer, controller: Controller, action: string, params: Record<string, string>): readonly (() => Promise<unknown>)[] {
        return [
            // Inject
            [...this.#injectMethods.entries()].map(([name, method]) => async () => {
                const injected = di.get(name);
                await method(controller, injected)
            }),

            // Startup
            [async () => {
                const method = this.#startupMethod;
                await method(controller);
            }],

            // Action
            [async () => {
                const method = this.#actionMethods.get(action)
                if (!method) return;
                await method(controller, params);
            }],

            // Before Render
            [async () => {
                const method = this.#beforeRenderMethod;
                await method(controller);
            }],

            // Render
            [async () => {
                const view = controller.getView();
                const method = this.#renderMethods.get(view);
                if (!method) return;
                await method(controller, params);
            }],

            // After Render
            [async () => {
                const method = this.#afterRenderMethod;
                await method(controller);
            }],

            // Shutdown
            [async () => {
                const method = this.#shutdownMethod;
                await method(controller);
            }],
        ].flat();
    }


    async launch(di: DIContainer, controller: Controller, action: string, params: Record<string, string>): Promise<Response> {
        const callbacks = this.#createMethodCallbacks(di, controller, action, params);
        let exit: Response | null = null;

        for (const callback of callbacks) {
            try {
                await callback();
            } catch (err) {
                if (exit) throw new Error("Http response already sent");
                exit = this.#caughtExit(err);
            }
        }

        if (exit === null) {
            throw new Error(`Container "${controller.constructor.name}" with initial action "${action}" did not return any expected exit.`);
        }

        return exit;
    }


    #caughtExit(errorOrExit: Error | ControllerExit): Response {
        if (!(errorOrExit instanceof ControllerExit)) {
            const error = errorOrExit;
            throw error;
        }

        const exit = errorOrExit;

        // Process Exit
        if (exit instanceof ControllerResponseExit) {
            const response = (exit as ControllerResponseExit).getReason();
            return response;
        }

        // if (exit instanceof ControllerRedirectExit) {
        //     const { meta, params, permanent } = (exit as ControllerRedirectExit).getReason();
        // }

        throw new Error("Unknown exit output");
    }
}

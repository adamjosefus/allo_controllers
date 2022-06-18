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


    async launch(di: DIContainer, controller: Controller, action: string, params: Record<string, string>): Promise<Response> {
        let exit: Response | null = null;

        const updateExit = (err: Error) => {
            if (exit) throw new Error("Http response already sent");
            exit = this.#caughtExit(err);
        }


        // Inject
        for (const [name, method] of this.#injectMethods) {
            try {
                await method(controller, di.get(name))
            } catch (err) {
                updateExit(err);
            }
        }


        // Startup
        try {
            await this.#startupMethod(controller);
        } catch (err) {
            updateExit(err);
        }


        // Action
        if (this.#actionMethods.has(action)) {
            const actionMethod = this.#actionMethods.get(action)!

            try {
                await actionMethod(controller, params);
            } catch (err) {
                updateExit(err);
            }
        }


        // Before Render
        const view = controller.getView();

        try {
            await this.#beforeRenderMethod(controller);
        } catch (err) {
            updateExit(err);
        }


        // Render
        if (this.#renderMethods.has(view)) {
            const renderMethod = this.#renderMethods.get(view)!;
            try {
                await renderMethod(controller, params);
            } catch (err) {
                updateExit(err);
            }
        }


        // After Render
        try {
            this.#afterRenderMethod(controller);
        } catch (err) {
            updateExit(err);
        }


        // Shutdown
        try {
            this.#shutdownMethod(controller);
        } catch (err) {
            updateExit(err);
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

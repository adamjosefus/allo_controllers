/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";


/**
 * @internal
 */
export abstract class ControllerExit<T = never> extends Error {

    readonly #controller: Controller;
    readonly #reason: T;


    constructor(controller: Controller, reason: T) {
        super(`Controller Exit - This exception should be caught.`);

        this.#controller = controller;
        this.#reason = reason;
    }


    getReason(): T {
        return this.#reason;
    }


    getController(): Controller {
        return this.#controller;
    }
}


export class ControllerResponseExit extends ControllerExit<Response> {
}


export class ControllerRedirectExit extends ControllerExit<{
    readonly meta: string,
    readonly params: Readonly<Record<string, string>>,
    readonly permanent: boolean,
}> {
}

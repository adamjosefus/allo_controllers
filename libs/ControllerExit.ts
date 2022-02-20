/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";


type Promisable<T> = T | Promise<T>;
type ExitValueType = Promisable<Response>;


export class ControllerExit extends Error {

    readonly #controller: Controller;
    readonly reason: ExitValueType;

    constructor(controller: Controller, reason: ExitValueType) {
        super(`Controller Exit - This exception should be caught.`);

        this.#controller = controller;
        this.reason = reason;

        this.#controller.shutdown();
    }


    getReason(): ExitValueType {
        return this.reason;
    }


    getController(): Controller {
        return this.#controller;
    }
}

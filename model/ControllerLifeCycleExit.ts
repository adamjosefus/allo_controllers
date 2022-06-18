/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";


type ExitReason = Response;


export class ControllerLifeCycleExit extends Error {

    readonly #controller: Controller;
    readonly reason: ExitReason;

    constructor(controller: Controller, reason: ExitReason) {
        super(`Controller Exit - This exception should be caught.`);

        this.#controller = controller;
        this.reason = reason;
    }


    getReason(): ExitReason {
        return this.reason;
    }


    getController(): Controller {
        return this.#controller;
    }
}

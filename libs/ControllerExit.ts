/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";


type Promisable<T> = T | Promise<T>;
type ExitValueType = Promisable<Response>;


export class ControllerExit extends Error {

    readonly #controller: Controller;
    readonly #output: ExitValueType;

    constructor(controller: Controller, output: ExitValueType) {
        super(`Controller Exit - This exception should be caught.`);

        this.#controller = controller;
        this.#output = output;

        this.#controller.shutdown();
    }


    getOutput(): ExitValueType {
        return this.#output;
    }

}
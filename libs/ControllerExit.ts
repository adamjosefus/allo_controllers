/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";


type Promisable<T> = T | Promise<T>;
type ExitValueType = Promisable<Response>;


export class ControllerExit extends Error {

    readonly #value: ExitValueType;
    readonly #controller: Controller;

    constructor(controller: Controller, output: ExitValueType) {
        super(`Controller Exit - This exception should be caught.`);

        this.#value = value;
        this.#controller = controller;

        this.#controller.shutdown();
    }


    getValue(): ExitValueType {
        return this.#value;
    }

}
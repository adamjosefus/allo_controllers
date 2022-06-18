/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Controller } from "./Controller.ts";


export class ControllerEvent<C extends Controller, T extends string> extends CustomEvent<{ controller: C }> {
    constructor(type: T, controller: C) {
        super(type, {
            detail: {
                controller
            },
        });
    }
}

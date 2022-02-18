/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { RouterList as SuperRouterList, type RouterOptions } from "https://deno.land/x/allo_routing@v1.0.1/mod.ts";
import { ControllerManager } from "./ControllerManager.ts";


export class RouterList extends SuperRouterList {

    readonly #manager: ControllerManager;


    constructor(manager: ControllerManager, options?: RouterOptions) {
        super(options);

        this.#manager = manager;
    }

}
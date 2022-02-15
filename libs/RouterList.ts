/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { RouterList as SuperRouterList, type RouterOptions } from "https://deno.land/x/allo_routing@v1.0.1/mod.ts";


export class RouterList extends SuperRouterList {

    constructor(options?: RouterOptions) {
        super(options);
    }

}
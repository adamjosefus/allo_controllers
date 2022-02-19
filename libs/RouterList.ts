/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { RouterList as SuperRouterList, Status, type RouterOptions, type ServeResponseType } from "https://deno.land/x/allo_routing@v1.1.2/mod.ts";
import { ControllerManager } from "./ControllerManager.ts";


export class RouterList extends SuperRouterList {

    readonly #manager: ControllerManager;


    constructor(manager: ControllerManager, options?: RouterOptions) {
        super(options);

        this.#manager = manager;
    }


    addController(mask: string, meta: string): void {
        const serveResponse: ServeResponseType = async (req: Request, params: Record<string, string>) => {
            try {
                return await this.#manager.createResponse(meta, req, params);
            } catch (error) {
                return this.getErrorReponse(Status.S500_InternalServerError, req, {
                    phrase: error.message,
                })
            }
        }

        this.add(mask, serveResponse);
    }

}
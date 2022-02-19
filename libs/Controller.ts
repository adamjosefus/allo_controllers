/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Status } from "https://deno.land/x/allo_routing@v1.1.2/mod.ts";
import { ControllerExit } from "./ControllerExit.ts";


export abstract class Controller {

    readonly #request: Request;

    constructor(request: Request) {
        this.#request = request;
    }


    getHttpRequest(): Request {
        return this.#request;
    }


    sendResponse(response: Response | Promise<Response>): void {
        throw new ControllerExit(response);
    }


    sendJson(data: unknown, pretty = false): void {
        const body = (() => {
            if (pretty) return JSON.stringify(data, null, 2);
            return JSON.stringify(data);
        })();

        const response = new Response(body, {
            headers: new Headers({
                "Content-Type": "application/json; charset=utf-8",
            }),
        });

        this.sendResponse(response);
    }


    sendPlainText(text: string): void {
        const response = new Response(text, {
            headers: new Headers({
                "Content-Type": "text/plain; charset=utf-8",
            }),
        });

        this.sendResponse(response);
    }


    redirectUrl(url: string): void {
        this.sendResponse(Response.redirect(url, Status.S302_Found));
    }


    // // TODO: redirect to pathname
    // // TODO: redirect to controller meta
    // redirect(meta: string): void {
    //     throw new Error("Not implemented");
    // }


    // // TODO: redirect to pathname
    // // TODO: redirect to controller meta
    // redirectPermanent(meta: string): void {
    //     throw new Error("Not implemented");
    // }
}
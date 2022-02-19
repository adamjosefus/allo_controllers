/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { Status } from "https://deno.land/x/allo_routing@v1.1.2/mod.ts";
import { ControllerExit } from "./ControllerExit.ts";


type SendFileEntry =
    | [path: string]
    | [file: File];


interface ControllerInterface {
    addEventListener(
        type: 'startup' | 'before-render' | 'shutdown',
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
}


export abstract class Controller extends EventTarget implements ControllerInterface {

    readonly #request: Request;

    constructor(request: Request) {
        super();

        this.#request = request;
    }


    startup(): void {
        this.dispatchEvent(new Event('startup'))
    }


    beforeRender(): void {
        this.dispatchEvent(new Event('before-render'))
    }


    shutdown(): void {
        this.dispatchEvent(new Event('shutdown'))
    }


    getHttpRequest(): Request {
        return this.#request;
    }


    sendResponse(response: Response | Promise<Response>): void {
        throw new ControllerExit(this, response);
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

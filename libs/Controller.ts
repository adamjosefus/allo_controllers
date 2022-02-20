/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { ControllerExit } from "./ControllerExit.ts";
import { Status } from "https://deno.land/x/allo_routing@v1.1.3/mod.ts";
import { FileResponse, JsonResponse, TextResponse } from "https://deno.land/x/allo_responses@v1.0.1/mod.ts";


class ControllerEvent<C extends Controller, T extends string> extends CustomEvent<{ controller: C }> {
    constructor(type: T, controller: C) {
        super(type, {
            detail: { controller }
        });
    }
}


interface IController<T extends string = 'startup' | 'before-render' | 'after-render' | 'shutdown'> {
    startup(): Promise<void> | void,
    beforeRender(): Promise<void> | void,
    afterRender(): Promise<void> | void,
    shutdown(): Promise<void> | void,

    addEventListener(type: T, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void,
    removeEventListener(type: T, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void,
    dispatchEvent(event: ControllerEvent<Controller, T>): boolean
}


export abstract class Controller extends EventTarget implements IController {

    readonly #request: Request;

    constructor(request: Request) {
        super();
        this.#request = request;
    }


    startup(): void {
        this.dispatchEvent(new ControllerEvent('startup', this));
    }


    beforeRender(): void {
        this.dispatchEvent(new ControllerEvent('before-render', this));
    }


    afterRender(): void {
        this.dispatchEvent(new ControllerEvent('after-render', this));
    }


    shutdown(): void {
        this.dispatchEvent(new ControllerEvent('shutdown', this));
    }


    getHttpRequest(): Request {
        return this.#request;
    }


    sendResponse(response: Response | Promise<Response>): void {
        throw new ControllerExit(this, response);
    }


    sendJson(data: unknown, prettyPrint = false): void {
        const response = new JsonResponse(data, {}, prettyPrint);
        this.sendResponse(response);
    }


    sendText(text: string): void {
        const response = new TextResponse(text);
        this.sendResponse(response);
    }


    sendFile(file: string | File | Deno.FsFile): void {
        const response = new FileResponse(file);
        this.sendResponse(response);
    }


    sendDownloadFile(file: string | File | Deno.FsFile, downloadName: string): void {
        const response = new FileResponse(file);
        response.headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);

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

/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { ControllerExit } from "./ControllerExit.ts";
import { Status } from "https://deno.land/x/allo_routing@v1.1.3/mod.ts";
import { FileResponse, JsonResponse, TextResponse } from "https://deno.land/x/allo_responses@v1.0.1/mod.ts";


export abstract class Controller {

    readonly #request: Request;

    constructor(request: Request) {
        this.#request = request;
    }


    startup(): void {
    }


    beforeRender(): void {
    }


    shutdown(): void {
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

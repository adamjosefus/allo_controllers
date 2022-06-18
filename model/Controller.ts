/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { FileResponse, JsonResponse, TextResponse } from "../libs/allo_responses.ts";
import { Status } from "../libs/allo_routing.ts";
import { ControllerResponseExit as ResponseExit, ControllerRedirectExit as RedirectExit } from "./ControllerExit.ts";


interface IController<T extends string = 'startup' | 'render' | 'shutdown'> {
    startup(): Promise<void> | void,
    beforeRender(): Promise<void> | void,
    afterRender(): Promise<void> | void,
    shutdown(): Promise<void> | void,
}


export abstract class Controller implements IController {

    readonly #httpRequest: Request;
    #httpResponse: Response | undefined;

    readonly #action: string;
    readonly #params: Record<string, string>;

    #forceView: string | null = null;


    constructor(request: Request, action: string, params: Record<string, string>) {
        this.#httpRequest = request;
        this.#httpResponse = undefined;

        this.#action = action;
        this.#params = params;
    }


    // #region — Common LyfeCycle
    /**
     * This method is part of the life cycle.
     * 
     * If you don't call `super.startup()`, then override this method.
     */
    startup(): void {
    }


    /**
     * This method is part of the life cycle.
     * 
     * If you don't call `super.beforeRender()`, then override this method.
     */
    beforeRender(): void {
    }


    /**
     * This method is part of the life cycle.
     * 
     * If you don't call `super.afterRender()`, then override this method.
     */
    afterRender(): void {
    }


    /**
     * This method is part of the life cycle.
     * 
     * If you don't call `super.shutdown()`, then override this method.
     */
    shutdown(): void {
    }
    // #endregion


    /**
     * Get name of requested action of controller.
     */
    getAction(): string {
        return this.#action;
    }


    /**
     * Manually change view from the controller.
     * 
     * No redirection occurs.
     */
    setView(view: string): void {
        this.#forceView = view;
    }


    /**
     * Get name of requested view of controller. If it is not mannually set, then it is the same as action.
     */
    getView(): string {
        return this.#forceView ?? this.#action;
    }


    // #region — Http
    /**
     * Returns the http request object.
     */
    getHttpRequest(): Request {
        return this.#httpRequest;
    }


    /**
     * Returns sended response or undefined if no response was sended.
     */
    getHttpResponse(): Response | undefined {
        return this.#httpResponse;
    }
    // #endregion


    // #region — Send Response
    sendResponse(response: Response): void {
        this.#httpResponse = response;

        throw new ResponseExit(this, response);
    }


    /**
     * Create and send data as json response.
     */
    sendJson(data: unknown, prettyPrint = false): void {
        const response = new JsonResponse(data, {}, prettyPrint);
        this.sendResponse(response);
    }


    /**
     * Create and send data as text response.
     */
    sendText(text: string): void {
        const response = new TextResponse(text);
        this.sendResponse(response);
    }


    /**
     * Create and send data as file response.
     */
    sendFile(file: string | File | Deno.FsFile): void {
        const response = new FileResponse(file);
        this.sendResponse(response);
    }


    sendDownloadFile(file: string | File | Deno.FsFile, downloadName: string): void {
        const response = new FileResponse(file);
        response.headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);

        this.sendResponse(response);
    }
    // #endregion


    // #region — Redirection
    redirectUrl(url: string): void {
        this.sendResponse(Response.redirect(url, Status.S302_Found));
    }


    // #redirect(meta: string, params: Record<string, string>, permanent: boolean): void {
    //     throw new RedirectExit(this, {
    //         meta,
    //         params,
    //         permanent
    //     })
    // }


    // redirect(meta: string, params?: Record<string, string>): void {
    //     this.#redirect(meta, params ?? {}, false);
    // }


    // redirectPermanent(meta: string, params?: Record<string, string>): void {
    //     this.#redirect(meta, params ?? {}, true);
    // }
    // #endregion
}

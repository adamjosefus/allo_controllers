/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


export abstract class Controller {

    readonly #request: Request;

    constructor(request: Request) {
        this.#request = request;
    }

}
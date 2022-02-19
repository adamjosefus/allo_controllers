/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


type Promisable<T> = T | Promise<T>;
type ExitValueType = Promisable<Response | Deno.FsFile | File | string | number>;


export class ControllerExit extends Error {

    readonly #value: ExitValueType;

    constructor(value: ExitValueType) {
        super(`Controller Exit - This exception should be caught.`);

        this.#value = value;
    }


    getValue(): ExitValueType {
        return this.#value;
    }

}
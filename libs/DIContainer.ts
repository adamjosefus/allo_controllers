import { Case } from "./helper/Case.ts";



export class DIContainer {

    #dependecies: Map<string, unknown> = new Map();

    // deno-lint-ignore ban-types
    add(name: string, instance: Object): void {
        if (!Case.isPascal(name)) {
            throw new Error(`Invalid dependency name: ${name}. Case must be Pascal`);
        }

        if (this.#dependecies.has(name)) {
            throw new Error(`Dependecy "${name}" already exists`);
        }

        this.#dependecies.set(name, instance);
    }


    get<T = unknown>(name: string): T {
        if (!this.#dependecies.has(name)) {
            throw new Error(`Dependecy "${name}" not found`);
        }

        return this.#dependecies.get(name)! as T;
    }
}

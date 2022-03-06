/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { join } from "https://deno.land/std@0.128.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.0.2/mod.ts";
import { Controller as AbstractController } from "./Controller.ts";


class Controller extends AbstractController { }


export class ControllerLoader {

    readonly #dir: string;
    readonly #classCache: Cache<{ new(): Controller }> = new Cache();


    constructor(dir: string) {
        this.#dir = dir;
    }


    async createInstanceObject(request: Request, controller: string, action: string, params: Record<string, string>): Promise<Controller> {
        const className = this.#computeClassName(controller);
        const classObject = await this.#getClassObject(className);

        const instance = new classObject(request, action, params);
        return instance;
    }


    async #getClassObject(className: string): Promise<typeof Controller> {
        // Load from cache
        const cacheKey = className;
        if (this.#classCache.has(cacheKey)) {
            return this.#classCache.load(cacheKey)!;
        }

        // Load from file
        const classObject = await this.#importClassObject(className);

        // Save to cache
        this.#classCache.save(cacheKey, classObject);

        return classObject;
    }


    async #importClassObject(className: string): Promise<{ new(): Controller }> {
        const path = this.#computeClassPath(className);
        const module = await import(path);
        const classObject = module[className] as { new(): Controller };

        return classObject;
    }


    #computeClassName(name: string): string {
        return `${name}Controller`;
    }


    #computeClassPath(className: string): string {
        return join(this.#dir, `${className}.ts`);
    }
}

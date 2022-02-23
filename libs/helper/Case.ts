/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { pipe } from "./pipe.ts";


export class Case {

    static #regex = {
        pascal: /^([A-Z][a-z]*[0-9]*)+$/,
    }


    static isPascal(s: string): boolean {
        return this.#regex.pascal.test(s);
    }


    static firstLower(s: string): string {
        return s.substring(0, 1).toLowerCase() + s.substring(1);
    }


    static firstUpper(s: string): string {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }


    static pascalToCamel(s: string): string {
        return this.firstLower(s);
    }


    static camelToKebab(s: string): string {
        return s.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
    }


    static pascalToKebab(s: string): string {
        return pipe(
            this.pascalToCamel,
            this.camelToKebab,
        )(s);
    }
}
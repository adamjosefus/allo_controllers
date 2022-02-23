/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { pipe } from "./pipe.ts";


export function firstLower(s: string): string {
    return s.substring(0, 1).toLowerCase() + s.substring(1);
}


export function firstUpper(s: string): string {
    return s.substring(0, 1).toUpperCase() + s.substring(1);
}


export function pascalToCamel(s: string): string {
    return firstLower(s);
}


export function camelToKebab(s: string): string {
    return s.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
}

export function pascalToKebab(s: string): string {
    return pipe(
        pascalToCamel,
        camelToKebab,
    )(s);
}

/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { pipe } from "./pipe.ts";


export class Case {
    
    static isPascal(s: string): boolean {
        return /^([A-Z][a-z]*[0-9]*)+$/.test(s);
    }


    static isCamal(s: string): boolean {
        return /^[a-z]+([A-Z][a-z]*[0-9]*)*$/.test(s);
    }


    static kebabToPascal(s: string): string {
        const parts = s.split('-');

        return parts.map(p => Case.upperFirst(p)).join('');
    }

    static kebabToCamel(s: string): string {
        return pipe(
            Case.kebabToPascal,
            Case.lowerFirst,
        )(s);
    }


    static lowerFirst(s: string): string {
        return s.substring(0, 1).toLowerCase() + s.substring(1);
    }


    static upperFirst(s: string): string {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }


    static pascalToCamel(s: string): string {
        return Case.lowerFirst(s);
    }


    static camelToKebab(s: string): string {
        return s.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
    }


    static pascalToKebab(s: string): string {
        return pipe(
            Case.pascalToCamel,
            Case.camelToKebab,
        )(s);
    }
}
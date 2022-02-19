/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


export function firstLower(str: string): string {
    return str.substring(0, 1).toLowerCase() + str.substring(1);
}


export function firstUpper(str: string): string {
    return str.substring(0, 1).toUpperCase() + str.substring(1);
}

import { URL } from "url"
import * as path from "path"
import * as fs from "fs"

export const emailRegex: RegExp = /^(([^<>()\[\]\\.,:\s@"]+(\.[^<>()\[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export type JsonTypeValue = string | number | boolean | null
export type JsonType = JsonHolder | JsonTypeValue
export type JsonHolder = JsonObject | JsonArray
export type JsonArray = JsonType[]
export interface JsonObject {
    [key: string]: JsonType
}

export type TypeChecker<T> = (value: any) => T | undefined

export interface VarDefinition<T> {
    key: string,
    types: [TypeChecker<T>, ...(TypeChecker<T>)[]]
    default?: T,
}

export type VarDefinitions = VarDefinition<any>[]

export interface TypeCheckers {
    [name: string]: TypeChecker<any>
}

export interface VariablesTypes {
    [key: string]: [TypeChecker<any>, ...TypeChecker<any>[]]
}

export function parseValue<T>(value: T, checker: [TypeChecker<any>, ...TypeChecker<any>[]]): T | undefined {
    for (let index = 0; index < checker.length; index++) {
        value = checker[index](value)
    }
    return value
}

export function parseEnv<T>(
    defaultEnv: T,
    types: VariablesTypes,
): T {
    const env: T = { ...defaultEnv }
    const varNames = Object.keys(types)
    for (let index = 0; index < varNames.length; index++) {
        const varName = varNames[index]
        const value = parseValue(
            process.env[varName] ?? env[varName] ?? undefined,
            types[varName]
        )
        if (value == undefined) {
            throw new Error("The environment variable '" + varName + "' has not the right type")
        }
        env[varName] = value
        process.env[varName] = typeof value.toString == "function" ?
            value.toString() :
            "" + value
    }
    return env
}

export const TC_JSON_OBJECT: TypeChecker<JsonObject> = (value) => {
    if (typeof value == "string") {
        try {
            const obj = JSON.parse(value)
            if (
                obj != null &&
                !Array.isArray(obj)
            ) {
                return obj as JsonObject
            }
        } catch (err) {
        }
    }
    return undefined
}

export const TC_JSON_ARRAY: TypeChecker<JsonArray> = (value) => {
    if (typeof value == "string") {
        try {
            const obj = JSON.parse(value)
            if (Array.isArray(obj)) {
                return obj as JsonArray
            }
        } catch (err) {
        }
    }
    return undefined
}

export const TC_JSON: TypeChecker<JsonType> = (value) => {
    if (typeof value == "string") {
        try {
            return JSON.parse(value)
        } catch (err) {
        }
    }
    return undefined
}

export const TC_OBJECT: TypeChecker<{ [key: string]: any }> = (value) => {
    if (
        !Array.isArray(value) ||
        value != null
    ) {
        return value as object
    }
    return undefined
}

export const TC_ARRAY: TypeChecker<any[]> = (value) => {
    if (Array.isArray(value)) {
        return value as any[]
    }
    return undefined
}

export const TC_STRING_NULL: TypeChecker<null> = (value) => {
    if (
        typeof value == "string" &&
        value.toLowerCase() == "null"
    ) {
        return null
    }
}

export const TC_BOOLEAN: TypeChecker<boolean> = (value) => {
    if (typeof value == "boolean") {
        return value
    } else if (typeof value == "string") {
        if (value.toLowerCase() == "true") {
            return true
        } else if (value.toLowerCase() == "false") {
            return true
        }
    }
    return undefined
}

export const TC_NUMBER: TypeChecker<number> = (value) => {
    if (typeof value == "number") {
        return value as number
    }
    const obj = Number(value)
    if (!isNaN(obj)) {
        return obj as number
    }
    return undefined
}

export const TC_EMAIL: TypeChecker<string> = (value) => {
    if (
        typeof value == "string" &&
        value.match(emailRegex)
    ) {
        return value
    }
    return undefined
}

export const TC_URL_HTTP: TypeChecker<string> = (value) => {
    try {
        const url = new URL(value)
        if (
            url.protocol != "http" &&
            url.protocol != "https"
        ) {
            return undefined
        }
        const value2 = url.toString()
        if (
            typeof value2 == "string" &&
            value2.length > 0
        ) {
            return value2
        }
    } catch (err) {
    }
    return undefined
}

export const TC_URL: TypeChecker<string> = (value) => {
    try {
        const url = new URL(value)
        const value2 = url.toString()
        if (
            typeof value2 == "string" &&
            value2.length > 0
        ) {
            return value2
        }
    } catch (err) {
    }
    return undefined
}

export const TC_PATH: TypeChecker<string> = (value) => {
    if (typeof value == "string") {
        const otherSep = path.sep == "/" ? "\\" : "/"
        const value2 = value
            .split(otherSep)
            .join(path.sep)
            .split(path.sep + path.sep)
            .join(path.sep)
            .split(path.sep)

        return (
            value2.length > 0 &&
                value2[0].endsWith(":") ?
                "" :
                path.sep
        ) + path.join(...value2)
    }
    return undefined
}

export const TC_PATH_DIR: TypeChecker<string> = (value) => {
    if (typeof value == "string") {
        const otherSep = path.sep == "/" ? "\\" : "/"
        const value2 = value
            .split(otherSep)
            .join(path.sep)
            .split(path.sep + path.sep)
            .join(path.sep)
            .split(path.sep)

        const path2 = (
            value2.length > 0 &&
                value2[0].endsWith(":") ?
                "" :
                path.sep
        ) + path.join(...value2)
        try {
            const stat = fs.statSync(path2)
            if (stat && stat.isDirectory()) {
                return path2
            }
        } catch (err: Error | any) {
            if (
                typeof err.message == "string" &&
                err.message.includes("no such file or directory")
            ) {
                return undefined
            }
            throw err
        }
    }
    return undefined
}

export const TC_PATH_FILE: TypeChecker<string> = (value) => {
    if (typeof value == "string") {
        const otherSep = path.sep == "/" ? "\\" : "/"
        const value2 = value
            .split(otherSep)
            .join(path.sep)
            .split(path.sep + path.sep)
            .join(path.sep)
            .split(path.sep)

        const path2 = (
            value2.length > 0 &&
                value2[0].endsWith(":") ?
                "" :
                path.sep
        ) + path.join(...value2)

        try {
            const stat = fs.statSync(path2)
            if (stat && stat.isFile()) {
                return path2
            }
        } catch (err: Error | any) {
            if (
                typeof err.message == "string" &&
                err.message.includes("no such file or directory")
            ) {
                return undefined
            }
            throw err
        }
    }
    return undefined
}

export const TC_PATH_EXIST: TypeChecker<string> = (value) => {
    if (typeof value == "string") {
        const otherSep = path.sep == "/" ? "\\" : "/"
        const value2 = value
            .split(otherSep)
            .join(path.sep)
            .split(path.sep + path.sep)
            .join(path.sep)
            .split(path.sep)

        const path2 = (
            value2.length > 0 &&
                value2[0].endsWith(":") ?
                "" :
                path.sep
        ) + path.join(...value2)
        try {
            const stat = fs.statSync(path2)
            if (
                stat &&
                (
                    stat.isFile() ||
                    stat.isDirectory()
                )
            ) {
                return path2
            }
        } catch (err: Error | any) {
            if (
                typeof err.message == "string" &&
                err.message.includes("no such file or directory")
            ) {
                return undefined
            }
            throw err
        }
    }
    return undefined
}

export const TC_PATH_NOT_EXIST: TypeChecker<string> = (value) => {
    if (typeof value == "string") {
        const otherSep = path.sep == "/" ? "\\" : "/"
        const value2 = value
            .split(otherSep)
            .join(path.sep)
            .split(path.sep + path.sep)
            .join(path.sep)
            .split(path.sep)

        const path2 = (
            value2.length > 0 &&
                value2[0].endsWith(":") ?
                "" :
                path.sep
        ) + path.join(...value2)

        try {
            const stat = fs.statSync(path2)
            if (
                !stat ||
                (
                    !stat.isFile() &&
                    !stat.isDirectory()
                )
            ) {
                return path2
            }
        } catch (err: Error | any) {
            if (
                typeof err.message == "string" &&
                err.message.includes("no such file or directory")
            ) {
                return path2
            }
            throw err
        }
    }
    return undefined
}

export const TC_STRING: TypeChecker<string> = (value) => {
    if (
        typeof value == "string" &&
        value.length > 0
    ) {
        return value
    }
    return undefined
}

export const TC_STRING_AND: TypeChecker<string> = (value) => {
    if (
        typeof value == "string" &&
        value.length > 0
    ) {
        return value
    }
    return undefined
}
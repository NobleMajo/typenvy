import { URL } from "url"
import * as path from "path"
import * as fs from "fs"
import * as os from "os"

export interface TypeChecker<T> {
    check: (value: any) => T | undefined,
    type: string,
}

export type JsonTypeValue = string | number | boolean | null
export type JsonType = JsonHolder | JsonTypeValue
export type JsonHolder = JsonObject | JsonArray
export type JsonArray = JsonType[]
export interface JsonObject {
    [key: string]: JsonType
}

export interface VariablesTypes {
    [key: string]: [TypeChecker<any>, ...TypeChecker<any>[]]
}

export interface EnvType {
    [key: string]: any
}

export type Awaitable<T> = Promise<T> | PromiseLike<T> | T

export interface Flag {
    name: string,
    description: string,
    displayName?: string,
    required?: boolean,
    default?: string | number | boolean,
    types?: ("string" | "number" | "boolean")[]
    shorthand?: string,
    alias?: string[],
    exe?: (cmd: any, value: string) => Awaitable<void>,
    exePriority?: number,
    multiValues?: boolean,
}
export function cmdFlag<F extends Flag>(
    flag: F,
    envKey: string,
    envTypes: VariablesTypes,
    env: any,
    ignoreErrors: boolean = false,
): F {
    return {
        ...flag,
        async exe(cmd, value) {
            value = parseValue(
                value ?? "true",
                envTypes[envKey]
            )
            if (value == undefined) {
                if (!ignoreErrors) {
                    throw new Error(
                        "The flag '" +
                        flag.name +
                        "' is not type of '" +
                        envTypes[envKey].map(
                            (c) => c.type
                        ).join("', '") +
                        "'"
                    )
                }
            }
            env[envKey] = value
            process.env[envKey] = "" + value
            if (flag.exe) {
                await flag.exe(cmd, value)
            }
        }
    }
}

export const emailRegex: RegExp = /^(([^<>()\[\]\\.,:\s@"]+(\.[^<>()\[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export function anyToString(value: any): string {
    return value && typeof value.toString == "function" ?
        value.toString() :
        "" + value
}

export class EnvResult<T> {
    constructor(
        public readonly env: T,
        public readonly errors: [string, Error][],
    ) {
    }

    overwriteEnv(
        env: { [key: string]: any }
    ): EnvResult<T> {
        Object.keys(env).forEach((key) => {
            this.env[key] = env[key]
        })
        return this
    }

    setMissingEnv(
        env: { [key: string]: any }
    ): EnvResult<T> {
        Object.keys(env).forEach((key) => {
            if (!this.env[key]) {
                this.env[key] = env[key]
            }
        })
        return this
    }

    setProcessEnv(): EnvResult<T> {
        Object.keys(this.env).forEach((key) => {
            process.env[key] = anyToString(this.env[key])
        })
        return this
    }

    clearProcessEnv(
        justEqualValues: boolean = true
    ): EnvResult<T> {
        Object.keys(this.env).forEach((key) => {
            if (
                justEqualValues &&
                this.env[key] != process.env[key]
            ) {
                return
            }
            delete process.env[key]
        })
        return this
    }

    errPrint(): EnvResult<T> {
        if (this.errors.length > 0) {
            console.log("Environment Errors:")
            for (let index = 0; index < this.errors.length; index++) {
                const error = this.errors[index];
                console.log("########## [ " + error[0] + " ]:")
                console.log(
                    (
                        error[1].stack ??
                        error[1].message ??
                        anyToString(error[1])
                    )
                        .split("\n")
                        .filter((v) => v.length != 0 && v != " ")
                        .join("\n")
                        .split("\n\n")
                        .join("\n")
                )
            }
        }
        return this
    }

    errThrow(): EnvResult<T> {
        if (this.errors.length > 0) {
            this.errPrint()
            throw new Error("Error in environment variables")
        }
        return this
    }

    errExit(exitCode: number = 1): EnvResult<T> | never {
        if (this.errors.length > 0) {
            this.errPrint()
            process.exit(exitCode)
        }
        return this
    }
}

export function parseValue<T>(
    value: T,
    checker: [
        TypeChecker<any>,
        ...TypeChecker<any>[]
    ]
): T | undefined {
    for (let index = 0; index < checker.length; index++) {
        const newValue = checker[index].check(value)
        if (newValue != undefined) {
            return newValue
        }
    }
    return undefined
}

export function parseEnv<T extends EnvType>(
    defaultEnv: T,
    types: VariablesTypes,
): EnvResult<T> {
    const env: T = { ...defaultEnv }
    const errors: [string, Error][] = []
    const varNames = Object.keys(types)
    for (let index = 0; index < varNames.length; index++) {
        const varName = varNames[index]
        const value = parseValue(
            process.env[varName] ?? env[varName] ?? undefined,
            types[varName]
        )
        if (value == undefined) {
            errors.push([
                varName,
                new Error(
                    "The environment variable '" +
                    varName +
                    "' is not type of '" +
                    types[varName].map((c) => c.type).join("', '") +
                    "'"
                )
            ])
            continue
        }
        (env as any)[varName] = value
    }
    return new EnvResult(env, errors)
}

export const TC_JSON_VALUE: TypeChecker<null | boolean | number | string> = {
    check: (value) => {
        if (typeof value == "string") {
            try {
                value = JSON.parse(value)
            } catch (err) {
            }
        }
        if (
            value == null ||
            typeof value == "boolean" ||
            typeof value == "number" ||
            typeof value == "string"
        ) {
            return value as null | boolean | number | string
        }
        return undefined
    },
    type: "JSON_VALUE"
}

export const TC_OBJECT: TypeChecker<{ [key: string]: any }> = {
    check: (value) => {
        if (
            typeof value == "string" &&
            value.length > 0
        ) {
            try {
                value = JSON.parse(value)
            } catch (err) {
            }
        }
        if (
            typeof value == "object" &&
            !Array.isArray(value) &&
            value != null
        ) {
            return value as object
        }
        return undefined
    },
    type: "OBJECT"
}

export const TC_ARRAY: TypeChecker<any[]> = {
    check: (value) => {
        if (
            typeof value == "string" &&
            value.length > 0
        ) {
            try {
                value = JSON.parse(value)
            } catch (err) {
            }
        }
        if (Array.isArray(value)) {
            return value
        }
        return undefined
    },
    type: "ARRAY"
}

export const TC_NULL: TypeChecker<null> = {
    check: (value) => {
        if (
            value == null ||
            (
                typeof value == "string" &&
                value.toLowerCase() == "null"
            )
        ) {
            return null
        }
    },
    type: "NULL"
}

export const TC_BOOLEAN: TypeChecker<boolean> = {
    check: (value) => {
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
    },
    type: "BOOLEAN"
}

export const TC_NUMBER: TypeChecker<number> = {
    check: (value) => {
        if (typeof value == "number") {
            return value as number
        }
        const obj = Number(value)
        if (!isNaN(obj)) {
            return obj as number
        }
        return undefined
    },
    type: "NUMBER"
}

export const TC_EMAIL: TypeChecker<string> = {
    check: (value) => {
        if (
            typeof value == "string" &&
            value.match(emailRegex)
        ) {
            return value
        }
        return undefined
    },
    type: "EMAIL"
}

export const TC_URL_HTTP: TypeChecker<string> = {
    check: (value) => {
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
    },
    type: "URL_HTTP"
}

export const TC_URL: TypeChecker<string> = {
    check: (value) => {
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
    },
    type: "URL"
}

export const TC_PATH: TypeChecker<string> = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/")
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value
                    }
                    value = process.cwd() + value
                }
            } else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value
            }
            value = path.normalize(value)
            return value
        }
        return undefined
    },
    type: "PATH"
}

export const TC_PATH_DIR: TypeChecker<string> = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/")
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value
                    }
                    value = process.cwd() + value
                }
            } else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value
            }
            value = path.normalize(value)
            try {
                const stat = fs.statSync(value)
                if (stat && stat.isDirectory()) {
                    return value
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
    },
    type: "PATH_DIR"
}

export const TC_PATH_FILE: TypeChecker<string> = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/")
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value
                    }
                    value = process.cwd() + value
                }
            } else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value
            }
            value = path.normalize(value)
            try {
                const stat = fs.statSync(value)
                if (stat && stat.isFile()) {
                    return value
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
    },
    type: "PATH_FILE"
}

export const TC_PATH_EXIST: TypeChecker<string> = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/")
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value
                    }
                    value = process.cwd() + value
                }
            } else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value
            }
            value = path.normalize(value)
            try {
                const stat = fs.statSync(value)
                if (
                    stat &&
                    (
                        stat.isFile() ||
                        stat.isDirectory()
                    )
                ) {
                    return value
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
    },
    type: "PATH_EXIST"
}

export const TC_PATH_NOT_EXIST: TypeChecker<string> = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/")
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value
                    }
                    value = process.cwd() + value
                }
            } else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value
            }
            value = path.normalize(value)
            try {
                const stat = fs.statSync(value)
                if (
                    !stat ||
                    (
                        !stat.isFile() &&
                        !stat.isDirectory()
                    )
                ) {
                    return value
                }
            } catch (err: Error | any) {
                if (
                    typeof err.message == "string" &&
                    err.message.includes("no such file or directory")
                ) {
                    return value
                }
                throw err
            }
        }
        return undefined
    },
    type: "PATH_NOT_EXIST"
}

export const TC_STRING: TypeChecker<string> = {
    check: (value) => {
        if (
            typeof value == "string" &&
            value.length > 0
        ) {
            return value
        }
        return undefined
    },
    type: "STRING"
}

export const TC_EMPTY_STRING: TypeChecker<string> = {
    check: (value) => {
        if (
            typeof value == "string"
        ) {
            return value
        }
        return undefined
    },
    type: "EMPTY_STRING"
}
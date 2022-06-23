import { URL } from "url"
import * as path from "path"
import * as fs from "fs"
import * as os from "os"
import { cmdyFlag as cmdyFlag2 } from './cmdy';

export const cmdyFlag = cmdyFlag2

export type BaseType = "boolean" | "number" | "string" |
    "symbol" | "object" | "bigint" | "function" |
    "unknown" | "array" | "null" | "undefined"

export function fullTypeOf(value: any): BaseType {
    let type: BaseType = typeof value
    if (type == "object") {
        if (type == null) {
            type = "null"
        } else if (Array.isArray(value)) {
            type = "array"
        }
    }
    return type
}

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

export const emailRegex: RegExp = /^(([^<>()\[\]\\.,:\s@"]+(\.[^<>()\[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export function anyToString(value: any): string {
    return value && typeof value.toString == "function" ?
        value.toString() :
        "" + value
}

export interface EnvData<T extends EnvType> {
    defaultEnv: T,
    types: VariablesTypes,
    env: T,
}

export class EnvError extends Error { }

export class EnvResult<T extends EnvType> implements EnvData<T> {
    public readonly envError: EnvError | undefined

    constructor(
        public readonly defaultEnv: T,
        public readonly types: VariablesTypes,
        public readonly env: T,
        public readonly errors: [string, Error][],
    ) {
        if (errors.length > 0) {
            this.envError = errors[0][1]
        }
    }

    overwriteEnv(
        env: { [key: string]: any }
    ): EnvResult<T> {
        Object.keys(env).forEach((key) => {
            (this.env as any)[key] = env[key]
        })
        return this
    }

    setMissingEnv(
        env: { [key: string]: any }
    ): EnvResult<T> {
        Object.keys(env).forEach((key) => {
            if (!this.env[key]) {
                (this.env as any)[key] = env[key]
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
            console.error("Environment Errors:")
            for (let index = 0; index < this.errors.length; index++) {
                const error = this.errors[index];
                console.error("########## [ " + error[0] + " ]:")
                console.error(
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
        if (this.envError) {
            throw this.envError
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

    getData(): EnvData<T> {
        return {
            defaultEnv: { ...this.defaultEnv },
            types: { ...this.types },
            env: { ...this.env },
        }
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
        let value = process.env[varName]
        if (
            value == undefined &&
            env[varName] != undefined
        ) {
            value = env[varName]
        }
        value = parseValue(
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

    return new EnvResult<T>(
        defaultEnv,
        types,
        env,
        errors
    )
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
    type: "JSON VALUE"
}

export const TC_JSON_OBJECT: TypeChecker<{ [key: string]: any }> = {
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
    type: "JSON OBJECT"
}

export const TC_JSON_ARRAY: TypeChecker<any[]> = {
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
    type: "JSON ARRAY"
}

export const TC_CSV_ARRAY: TypeChecker<any[]> = {
    check: (value) => {
        if (
            typeof value == "string" &&
            value.length > 0
        ) {
            value = value.split(",").map((v) => {
                while (v.startsWith(" ")) {
                    v = v.substring(1)
                }
                while (v.endsWith(" ")) {
                    v = v.slice(0, -1)
                }
                return v
            })
        }
        if (Array.isArray(value)) {
            return value
        }
        return undefined
    },
    type: "CSV ARRAY"
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

export const TC_UNDEFINED_AS_NULL: TypeChecker<null> = {
    check: (value) => {
        if (
            value == undefined ||
            TC_NULL.check(value) == null
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
    type: "HTTP URL(STRING)"
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
    type: "EXISTING DIR PATH"
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
    type: "EXISTING FILE PATH"
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
    type: "EXISTING PATH"
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
    type: "NOT EXISTING PATH"
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
    type: "EMPTY STRING"
}

export const TC_NUMBER: TypeChecker<number> = {
    check: (value) => {
        if (typeof value == "number") {
            return value as number
        }
        value = Number(value)
        if (!isNaN(value)) {
            return value as number
        }
        return undefined
    },
    type: "NUMBER"
}


export const TC_PORT: TypeChecker<number> = {
    check: (value) => {
        if (
            typeof value == "number" &&
            value >= 0 && value <= 65535
        ) {

            return value as number
        }
        value = Number(value)
        if (
            !isNaN(value) &&
            value >= 0 && value <= 65535
        ) {
            return value as number
        }
        return undefined
    },
    type: "PORT"
}

const allowedCalculationChars = "/*+-1234567890()"
export const TC_CALCULATION: TypeChecker<number> = {
    check: (value) => {
        if (typeof value == "number") {
            return value as number
        }
        let newValue = Number(value)
        if (!isNaN(newValue)) {
            return newValue as number
        }
        if (typeof value == "string") {
            for (const char of value) {
                if (!allowedCalculationChars.includes(char)) {
                    return undefined
                }
            }
            const newValue = Number(eval(value))
            if (!isNaN(newValue)) {
                return newValue as number
            }
        }
        return undefined
    },
    type: "MATH CALCULATION"
}
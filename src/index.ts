import { URL } from "url"
import * as path from "path"
import * as fs from "fs"

export const emailRegex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export type JsonTypeValue = string | number | boolean | null
export type JsonType = JsonHolder | JsonTypeValue
export type JsonHolder = JsonObject | JsonArray
export type JsonArray = JsonType[]
export interface JsonObject {
    [key: string]: JsonType
}

export class EnvError extends Error {
    public readonly type: string = "EnvError"

    constructor(
        msg: string,
    ) {
        super(msg)
        this.exe = (): void => {
            console.error("Environment Error:\n" + this.message)
            process.exit(1)
        }
    }

    public readonly exe: (exit?: boolean) => void

    static isEnvError(obj: any): boolean {
        return obj instanceof Error && (obj as EnvError).type == "EnvError"
    }
}

export const types: {
    [key: string]: (value: any) => any | undefined
} = {
    "json:object": (value) => {
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
    },
    "json:array": (value) => {
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
    },
    "json": (value) => {
        if (typeof value == "string") {
            try {
                return JSON.parse(value)
            } catch (err) {
            }
        }
        return undefined
    },
    "array": (value) => {
        if (Array.isArray(value)) {
            return value as any[]
        }
        return undefined
    },
    "object": (value) => {
        if (
            !Array.isArray(value) ||
            value != null
        ) {
            return value as object
        }
        return undefined
    },
    "null:value": (value) => {
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
    "boolean": (value) => {
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
    "number": (value) => {
        if (typeof value == "number") {
            return value as number
        }
        const obj = Number(value)
        if (!isNaN(obj)) {
            return obj as number
        }
        return undefined
    },
    "email": (value) => {
        if (
            typeof value == "string" &&
            value.match(emailRegex)
        ) {
            return value
        }
    },
    "url:http": (value) => {
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
    "url": (value) => {
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
    "path": (value) => {
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
    },
    "path:dir": (value) => {
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
    },
    "path:file": (value) => {
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
    },
    "path:exist": (value) => {
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
    },
    "path:notexist": (value) => {
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
    },
    "string": (value) => {
        if (
            typeof value == "string" &&
            value.length > 0
        ) {
            return value as string
        }
        return undefined
    },
    "string:empty": (value) => {
        if (typeof value == "string") {
            return value as string
        }
        return undefined
    },
    "null": (value) => {
        return null
    },
    "any": (value) => {
        return value as any
    },
}

export interface EnvrionmentOptions {
    loadProcessEnv?: boolean
    saveProcessEnv?: boolean,
    addDefaultTypes?: boolean,
    execErrors?: boolean,
    readRequiredValues?: boolean,
    types?: {
        [key: string]: <T>(value: any) => T | undefined
    }
}

export interface EnvrionmentSettings extends EnvrionmentOptions {
    loadProcessEnv: boolean,
    saveProcessEnv: boolean,
    addDefaultTypes: boolean,
    execErrors: boolean,
    readRequiredValues?: boolean,
    types: {
        [key: string]: (value: any) => any | undefined
    }
}

export const defaultEnvrionmentSettings: EnvrionmentSettings = {
    loadProcessEnv: true,
    saveProcessEnv: true,
    addDefaultTypes: true,
    execErrors: true,
    readRequiredValues: true,
    types: {}
}

export class EnvironmentParser {
    public readonly settings: EnvrionmentSettings
    public readonly typeIds: string[]
    private definedKeyTypes: {
        [key: string]: string[]
    } = {}
    private requiredKeys: string[] = []

    constructor(
        options?: EnvrionmentOptions
    ) {
        this.settings = {
            ...defaultEnvrionmentSettings,
            ...options,
        }
        if (this.settings.addDefaultTypes) {
            this.settings.types = {
                ...(options ?? {}).types ?? {},
                ...types
            }
        } else {
            this.settings.types = { ...options.types }
        }

        this.typeIds = Object.keys(this.settings.types)
        if (this.typeIds.length < 1) {
            throw new EnvError("No type is defined!")
        }
    }

    defineCustomType(
        type: string,
        controlFunc: (value: any) => undefined | any
    ): void {
        this.settings.types[type] = controlFunc
        this.typeIds.unshift(type)
    }

    defineCustomRegexType(type: string, regex: RegExp): void {
        this.defineCustomType(
            type,
            (value) =>
                typeof value == "string" &&
                    regex.test(value) ?
                    value :
                    undefined
        )
    }

    checkValue(key: string, value: any, types: string[], defaultValue?: any): any {
        if (!types || types.length == 0) {
            throw new EnvError("No types defined for '" + key + "'!")
        }
        types.forEach((type) => {
            if (!this.typeIds.includes(type)) {
                throw new EnvError("The typeId '" + type + "' is not defined!")
            }
        })
        let value2: any | undefined = undefined
        for (let index = 0; index < this.typeIds.length; index++) {
            const typeId = this.typeIds[index]
            if (types.includes(typeId)) {
                value2 = this.settings.types[typeId](value)
                if (
                    value2 != undefined
                ) {
                    break
                }
            }
        }
        if (
            value2 == undefined &&
            value2 != null
        ) {
            if (defaultValue) {
                return defaultValue
            }
            let types2: string
            if (types.length == 1) {
                types2 = "need to be type of '" + types[0] + "'!"
            } else {
                let last = types.pop()
                types2 = "need to be one of this types:\n'" + types.join("', '") + "' or '" + last + "'!"
            }
            throw new EnvError("The value of '" + key + "' " + types2)
        }
        return value2
    }

    checkObject<T>(
        obj: any,
        defaultValues?: T
    ): T {
        if (typeof obj != "object") {
            throw new EnvError("Can just check a object!")
        }
        const obj2: any = {}
        const keys: string[] = Object.keys(this.definedKeyTypes)
        for (let index = 0; index < keys.length; index++) {
            const key: string = keys[index]
            obj2[key] = this.checkValue(
                key,
                obj[key],
                this.definedKeyTypes[key],
                defaultValues ? defaultValues[key] : undefined
            )
        }
        if (defaultValues) {
            this.requiredKeys.forEach((key: string) => {
                if (obj2[key] == undefined) {
                    const types = this.definedKeyTypes[key]
                    let types2: string
                    if (types.length == 1) {
                        types2 = "is required and need to be type of '" + types[0] + "'!"
                    } else {
                        let last = types.pop()
                        types2 = "is required and need to be one of this types:\n'" + types.join("', '") + "' or '" + last + "'!"
                    }
                    throw new EnvError("The value of '" + key + "' " + types2)
                }
            })
            Object.keys(this.definedKeyTypes).forEach((element: string) => {
                if (obj2[element] == undefined) {
                    obj2[element] = defaultValues[element]
                }
            })
        }
        return obj2
    }

    define(key: string, ...types: string[]): void {
        this.definedKeyTypes[key] = types
    }

    require(key: string, ...types: string[]): void {
        if (!this.requiredKeys.includes(key)) {
            this.requiredKeys.push(key)
        }
        this.define(key, ...types)
    }

    undefine(key: string): void {
        this.requiredKeys = this.requiredKeys.filter((r) => r == key)
        delete this.definedKeyTypes[key]
    }

    parseEnv<T extends { [key: string]: any }>(
        defaultEnv: T,
        ...envValueObjects: any[]
    ): {
        env?: T,
        err?: Error | any,
        exe?: () => void
    } {
        try {
            if (this.settings.loadProcessEnv == true) {
                defaultEnv = {
                    ...defaultEnv,
                    ...process.env
                }
            }

            defaultEnv = this.checkObject(defaultEnv)

            let result = defaultEnv

            if (envValueObjects.length > 0) {
                let envValueMerge = {}
                envValueObjects.forEach((envValueObject: any) => {
                    if (
                        typeof envValueObject == "object" &&
                        envValueObject != null &&
                        !Array.isArray(envValueObject)
                    ) {
                        envValueMerge = {
                            ...envValueMerge,
                            ...envValueObject
                        }
                    }
                })

                result = this.checkObject(envValueMerge, defaultEnv)
            }

            if (this.settings.saveProcessEnv == true) {
                defaultEnv = {
                    ...defaultEnv,
                    ...process.env
                }
            }

            return {
                env: result
            }
        } catch (err: EnvError | Error | any) {
            if (
                this.settings.execErrors &&
                err.type == "EnvError"
            ) {
                return {
                    err: err,
                    exe: () => err.exe()
                }
            }
            return {
                err: err,
                exe: () => {
                    console.error("Unknown error!\n", err)
                    process.exit(0)
                }
            }
        }
    }
}
import { EnvData, parseValue } from "./index";

export type Awaitable<T> = Promise<T> | PromiseLike<T> | T

export interface InputValidator {
    name: string;
    validate: (value: any) => Awaitable<any | undefined>;
}
export declare type FlagValueTypes = "string" | "number" | "boolean" | InputValidator;
export interface Flag {
    name: string;
    description: string;
    displayName?: string;
    required?: boolean;
    default?: string | number | boolean;
    types?: FlagValueTypes[];
    shorthand?: string;
    alias?: string[];
    control?: (value: string) => Awaitable<string>;
    exe?: (cmd: any, value: string) => Awaitable<void>;
    exePriority?: number;
    multiValues?: boolean;
}
export interface BoolFlag extends Flag {
    types?: undefined
    control?: undefined
    default?: undefined
    required?: undefined
    multiValues?: undefined
}
export interface ValueFlag extends Flag {
    types: FlagValueTypes[]
}

export const stringBooleanValues = ["true", "false"]

export function cmdyFlag<F extends ValueFlag | BoolFlag>(
    flag: F,
    envKey: string,
    envData: EnvData<any>,
    ignoreErrors: boolean = false,
): F {
    let des: string = flag.description
    if (envData.defaultEnv[envKey] != undefined) {
        des += " (default: '" + envData.defaultEnv[envKey] + "', "
    } else {
        des += " ("
    }
    des += "ENV: '" + envKey + "')"

    return {
        ...flag,
        description: des,
        async exe(cmd, value) {
            if (typeof flag.types == "string") {
                if (!stringBooleanValues.includes(value.toLowerCase())) {
                    value = "" + envData.defaultEnv[envKey]
                    if (!stringBooleanValues.includes(value.toLowerCase())) {
                        value = "" + (!Boolean(value.toLowerCase()))
                    }
                    if (!stringBooleanValues.includes(value.toLowerCase())) {
                        value = "" + flag.default
                        if (!stringBooleanValues.includes(value.toLowerCase())) {
                            value = "" + (!Boolean(value.toLowerCase()))
                        }
                    }
                }
            }
            value = parseValue(
                value,
                envData.types[envKey]
            )
            if (value == undefined) {
                if (!ignoreErrors) {
                    throw new Error(
                        "The flag '" +
                        flag.name +
                        "' is not type of '" +
                        envData.types[envKey].map(
                            (c) => c.type
                        ).join("', '") +
                        "'"
                    )
                }
            }
            if (
                Array.isArray(envData.env[envKey])
            ) {
                if (Array.isArray(value)) {
                    envData.env[envKey] = [
                        ...envData.env[envKey],
                        ...value,
                    ]
                } else {
                    envData.env[envKey].push(value)
                }
                if (
                    !process.env[envKey] ||
                    process.env[envKey].length == 0
                ) {
                    process.env[envKey] = value
                } else {
                    process.env[envKey] = ", " + value
                }
            } else if (flag.multiValues) {
                throw new Error(
                    "The flag '" +
                    flag.name +
                    "' is a multiValues but env value is not an array!"
                )
            } else {
                envData.env[envKey] = value
                process.env[envKey] = "" + value
            }
            if (flag.exe) {
                await flag.exe(cmd, value)
            }
        }
    }
}

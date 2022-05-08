export interface TypeChecker<T> {
    check: (value: any) => T | undefined;
    type: string;
}
export declare type JsonTypeValue = string | number | boolean | null;
export declare type JsonType = JsonHolder | JsonTypeValue;
export declare type JsonHolder = JsonObject | JsonArray;
export declare type JsonArray = JsonType[];
export interface JsonObject {
    [key: string]: JsonType;
}
export interface VariablesTypes {
    [key: string]: [TypeChecker<any>, ...TypeChecker<any>[]];
}
export interface EnvType {
    [key: string]: any;
}
export declare type Awaitable<T> = Promise<T> | PromiseLike<T> | T;
export interface Flag {
    name: string;
    description: string;
    displayName?: string;
    required?: boolean;
    default?: string | number | boolean;
    types?: ("string" | "number" | "boolean")[];
    shorthand?: string;
    alias?: string[];
    exe?: (cmd: any, value: string) => Awaitable<void>;
    exePriority?: number;
    multiValues?: boolean;
}
export declare function cmdFlag<F extends Flag>(flag: F, envKey: string, envTypes: VariablesTypes, env: any, ignoreErrors?: boolean): F;
export declare const emailRegex: RegExp;
export declare function anyToString(value: any): string;
export declare class EnvResult<T> {
    readonly env: T;
    readonly errors: [string, Error][];
    constructor(env: T, errors: [string, Error][]);
    overwriteEnv(env: {
        [key: string]: any;
    }): EnvResult<T>;
    setMissingEnv(env: {
        [key: string]: any;
    }): EnvResult<T>;
    setProcessEnv(): EnvResult<T>;
    clearProcessEnv(justEqualValues?: boolean): EnvResult<T>;
    errPrint(): EnvResult<T>;
    errThrow(): EnvResult<T>;
    errExit(exitCode?: number): EnvResult<T> | never;
}
export declare function parseValue<T>(value: T, checker: [
    TypeChecker<any>,
    ...TypeChecker<any>[]
]): T | undefined;
export declare function parseEnv<T extends EnvType>(defaultEnv: T, types: VariablesTypes): EnvResult<T>;
export declare const TC_JSON_VALUE: TypeChecker<null | boolean | number | string>;
export declare const TC_OBJECT: TypeChecker<{
    [key: string]: any;
}>;
export declare const TC_ARRAY: TypeChecker<any[]>;
export declare const TC_NULL: TypeChecker<null>;
export declare const TC_BOOLEAN: TypeChecker<boolean>;
export declare const TC_NUMBER: TypeChecker<number>;
export declare const TC_EMAIL: TypeChecker<string>;
export declare const TC_URL_HTTP: TypeChecker<string>;
export declare const TC_URL: TypeChecker<string>;
export declare const TC_PATH: TypeChecker<string>;
export declare const TC_PATH_DIR: TypeChecker<string>;
export declare const TC_PATH_FILE: TypeChecker<string>;
export declare const TC_PATH_EXIST: TypeChecker<string>;
export declare const TC_PATH_NOT_EXIST: TypeChecker<string>;
export declare const TC_STRING: TypeChecker<string>;
export declare const TC_EMPTY_STRING: TypeChecker<string>;
export declare const TC_CALCULATION: TypeChecker<number>;

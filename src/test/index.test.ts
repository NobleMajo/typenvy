import "mocha"
import "chai"
import { expect } from "chai"

import * as typenvy from "../index"
import { VariablesTypes } from '../index';

export const exampleSourceEnv = {
    PRODUCTION: (process.env.NODE_ENV === "production") as boolean,
    VERBOSE: false as boolean,

    DNS_SERVER_ADDRESSES: [
        "127.0.0.11",
        "1.0.0.1",
        "8.8.4.4",
        "1.1.1.1",
        "8.8.8.8"
    ] as string[],
    HTTP_PORT: 80 as number,
    HTTPS_PORT: 443 as number,
    BIND_ADDRESS: "0.0.0.0" as string,

    CERT_PATH: "./certs/cert.pem" as string,
    KEY_PATH: "./certs/privkey.pem" as string,
    CA_PATH: "./certs/chain.pem" as string,

    IGNORE_EMPTY_CERT: true as boolean,

    STATIC_PATH: "./public" as string,
}

export const exampleChecker: VariablesTypes = {
    PRODUCTION: [typenvy.TC_BOOLEAN],
    VERBOSE: [typenvy.TC_BOOLEAN],
    DNS_SERVER_ADDRESSES: [typenvy.TC_ARRAY],
    HTTP_PORT: [typenvy.TC_NUMBER],
    HTTPS_PORT: [typenvy.TC_NUMBER],
    BIND_ADDRESS: [typenvy.TC_STRING],
    CERT_PATH: [typenvy.TC_PATH],
    KEY_PATH: [typenvy.TC_PATH],
    CA_PATH: [typenvy.TC_PATH],
    IGNORE_EMPTY_CERT: [typenvy.TC_BOOLEAN],
    STATIC_PATH: [typenvy.TC_PATH],
}

export type BaseType = "boolean" | "number" | "string" |
    "symbol" | "object" | "bigint" | "function" |
    "unknown" | "array" | "null" | "undefined"



export function fullTypeOf(value: any): BaseType {
    let type: BaseType = typeof value
    if (type == "object") {
        if (type == null) {
            type = "null"
        } else if (Array.isArray(type)) {
            type = "array"
        }
    }
    return type
}

describe('Test typenvy EnvironmentParser class', () => {
    let sourceEnv: typeof exampleSourceEnv
    let checker: VariablesTypes

    beforeEach("Reset example values", () => {
        sourceEnv = { ...exampleSourceEnv }
        checker = { ...exampleChecker }
    })

    it("envParser should check types", async () => {
        const newEnv = typenvy
            .parseEnv(sourceEnv, checker)
            .errThrow()
            .clearProcessEnv()
            .env

        sourceEnv["STATIC_PATH"] = process.cwd() + "/public"
        sourceEnv["CERT_PATH"] = process.cwd() + "/certs/cert.pem"
        sourceEnv["KEY_PATH"] = process.cwd() + "/certs/privkey.pem"
        sourceEnv["CA_PATH"] = process.cwd() + "/certs/chain.pem"

        expect(newEnv).is.eql(sourceEnv)
    })

    it("envParser should use process.env vars", async () => {
        process.env["VERBOSE"] = "true"
        process.env["HTTPS_PORT"] = "54321"
        process.env["BIND_ADDRESS"] = "127.0.0.1"
        process.env["STATIC_PATH"] = "public"

        const newEnv = typenvy
            .parseEnv(sourceEnv, checker)
            .errThrow()
            .clearProcessEnv()
            .env

        sourceEnv["VERBOSE"] = true
        sourceEnv["HTTPS_PORT"] = 54321
        sourceEnv["BIND_ADDRESS"] = "127.0.0.1"
        sourceEnv["STATIC_PATH"] = process.cwd() + "/public"
        sourceEnv["CERT_PATH"] = process.cwd() + "/certs/cert.pem"
        sourceEnv["KEY_PATH"] = process.cwd() + "/certs/privkey.pem"
        sourceEnv["CA_PATH"] = process.cwd() + "/certs/chain.pem"
        expect(newEnv).is.eql(sourceEnv)
    })

    it("check with string value as boolean", async () => {
        sourceEnv.VERBOSE = "hallo world" as any

        const res = typenvy
            .parseEnv(sourceEnv, checker)
            .clearProcessEnv()

        expect(fullTypeOf(res.errors[0])).is.equals("array")
        expect(res.errors[0].length).is.equals(2)
        expect(res.errors[0][1].message).is.equals(
            "The environment variable 'VERBOSE' is not type of 'BOOLEAN'"
        )
        expect(res.errors[1]).is.equals(undefined)
    })

    it("check with 'true' value as number", async () => {
        process.env["HTTPS_PORT"] = "true"

        const res = typenvy
            .parseEnv(sourceEnv, checker)
            .clearProcessEnv()

        expect(fullTypeOf(res.errors[0])).is.equals("array")
        expect(res.errors[0].length).is.equals(2)
        expect(res.errors[0][1].message).is.equals(
            "The environment variable 'HTTPS_PORT' is not type of 'NUMBER'"
        )
        expect(res.errors[1]).is.equals(undefined)
    })

    it("check with wrong type object on number", async () => {
        exampleChecker.HTTP_PORT = [typenvy.TC_OBJECT]

        const res = typenvy
            .parseEnv(sourceEnv, checker)
            .clearProcessEnv()

        expect(fullTypeOf(res.errors[0])).is.equals("array")
        expect(res.errors[0].length).is.equals(2)
        expect(res.errors[0][1].message).is.equals(
            "The environment variable 'HTTPS_PORT' is not type of 'NUMBER'"
        )
        expect(res.errors[1]).is.equals(undefined)
    })

    it("envParser should errors if is wrong process.env types", async () => {
        sourceEnv.PRODUCTION = "test" as any

        process.env["VERBOSE"] = "123"
        process.env["HTTPS_PORT"] = "true"
        process.env["BIND_ADDRESS"] = ""
        process.env["STATIC_PATH"] = "./public"

        const res = typenvy
            .parseEnv(sourceEnv, checker)
            .clearProcessEnv()
        expect(res.errors.length).is.equals(5)
    })
})

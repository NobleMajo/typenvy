import "mocha"
import { expect } from "chai"

import * as typenvy from "../index"
import { VariablesTypes } from '../index'
import { exampleChecker, exampleSourceEnv } from "./example"

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

describe('Test typenvy EnvironmentParser class', () => {
    it("envParser should check types", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

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

    it("envParser should use process.env vars", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

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

    it("check with string value as boolean", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        sourceEnv.PRODUCTION = "hallo world" as any

        const res = typenvy
            .parseEnv(sourceEnv, checker)
            .clearProcessEnv()

        expect(fullTypeOf(res.errors)).is.equals("array")
        expect(res.errors.length).is.equals(1)

        expect(fullTypeOf(res.errors[0])).is.equals("array")
        expect(res.errors[0].length).is.equals(2)
        expect(res.errors[0][1].message).is.equals(
            "The environment variable 'PRODUCTION' is not type of 'BOOLEAN'"
        )
        expect(res.errors[1]).is.equals(undefined)
    })

    it("check with 'true' value as port", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        process.env["HTTPS_PORT"] = "true"

        const res = typenvy
            .parseEnv(sourceEnv, checker)

        expect(fullTypeOf(res.errors)).is.equals("array")
        expect(res.errors.length).is.equals(1)

        expect(fullTypeOf(res.errors[0])).is.equals("array")
        expect(res.errors[0].length).is.equals(2)
        expect(res.errors[0][1].message).is.equals(
            "The environment variable 'HTTPS_PORT' is not type of 'PORT'"
        )
        expect(res.errors[1]).is.equals(undefined)
        delete process.env["HTTPS_PORT"]
    })

    it("check with 65536  value as port", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        process.env["HTTPS_PORT"] = "65536"

        const res = typenvy
            .parseEnv(sourceEnv, checker)

        expect(fullTypeOf(res.errors)).is.equals("array")
        expect(res.errors.length).is.equals(1)

        expect(fullTypeOf(res.errors[0])).is.equals("array")
        expect(res.errors[0].length).is.equals(2)
        expect(res.errors[0][1].message).is.equals(
            "The environment variable 'HTTPS_PORT' is not type of 'PORT'"
        )
        expect(res.errors[1]).is.equals(undefined)
        delete process.env["HTTPS_PORT"]
    })

    it("check with wrong type object on number", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        checker.HTTP_PORT = [typenvy.TC_JSON_OBJECT]

        const res = typenvy
            .parseEnv(sourceEnv, checker)

        expect(
            fullTypeOf(res.errors),
            "Check error array is an array"
        ).is.equals("array")
        expect(
            res.errors.length,
            "Check error count"
        ).is.equals(1)
        expect(
            fullTypeOf(res.errors[0]),
            "Check if error is a tuple array"
        ).is.equals("array")
        expect(
            res.errors[0].length,
            "Check error tuple size"
        ).is.equals(2)
        expect(res.errors[0][1].message,
            "Check error message"
        ).is.equals(
            "The environment variable 'HTTP_PORT' is not type of 'JSON OBJECT'"
        )
        expect(res.errors[1], "Check if 2. error is undefined").is.equals(undefined)
    })

    it("envParser should errors if has wrong types", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        checker.STATIC_PATH = [typenvy.TC_EMAIL]

        let sourceEnv2 = sourceEnv as any
        sourceEnv2["PRODUCTION"] = "test"
        sourceEnv2["HTTPS_PORT"] = "true"
        sourceEnv2["BIND_ADDRESS"] = ""
        sourceEnv2["STATIC_PATH"] = "./public"

        const res = typenvy.parseEnv(
            sourceEnv2,
            checker
        )
        expect(res.errors.length).is.equals(4)
    })
})

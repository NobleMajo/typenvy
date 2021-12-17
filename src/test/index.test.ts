import "mocha"
import "chai"

import { EnvError, Environment } from "../index"
import { expect } from "chai"

describe('Test typenvy Environment class', () => {

    it("basic environment test", async () => {
        const env = new Environment({
            loadProcessEnv: false,
        })

        env.define("testvalue", "string")
        const defaultEnv = {
            testvalue: "test",
            test2value: "testdsdads",
            undefinedType: "test123",
            somevalue: { test: [] },
            numbervalue: 123,
            booleanvalue: true,
            number2value: "123",
            boolean2value: "true"
        }
        env.define("test2value", "string")
        env.define("somevalue", "string", "object")
        env.define("numbervalue", "number")
        env.define("booleanvalue", "boolean")
        env.define("number2value", "number")
        env.define("boolean2value", "boolean")

        const env2 = env.parseEnv(defaultEnv, {})

        expect(typeof env2.testvalue).is.equals("string")
        expect(typeof env2.test2value).is.equals("string")
        expect(typeof env2.undefinedType).is.equals("undefined")
        expect(typeof env2.somevalue).is.equals("object")
        expect(typeof env2.numbervalue).is.equals("number")
        expect(typeof env2.booleanvalue).is.equals("boolean")
        expect(typeof env2.number2value).is.equals("number")
        expect(typeof env2.boolean2value).is.equals("boolean")
    })

    it("error environment test", async () => {
        const env = new Environment({
            loadProcessEnv: false,
        })

        const defaultEnv = {
            somevalue: { test: [] },
        }
        env.define("testvalue", "string")
        env.require("somevalue", "string",)

        const value = await createCatchPromise((async () => {
            return env.parseEnv({}, defaultEnv)
        })())

        expect(typeof value).is.equals("object")
        expect(value instanceof Error).is.true
        expect(EnvError.isEnvError(value)).is.true
        expect(typeof value.message).is.equals("string")
    })

    it("json environment test", async () => {
        const env = new Environment({
            loadProcessEnv: false,
        })

        const defaultEnv = {
            test1: "{}",
            test2: "[]",
            test3: "{}",
            test4: "[]",
            test5: null,
        }
        env.define("test1", "json:object")
        env.define("test2", "json:array")
        env.define("test3", "json")
        env.define("test4", "json")
        env.define("test5", "json", "null")

        const env2 = env.parseEnv(defaultEnv)

        expect(typeof env2.test1).is.equals("object")
        expect(Array.isArray(env2.test1)).is.false
        expect(env2.test1 == null).is.false

        expect(typeof env2.test2).is.equals("object")
        expect(Array.isArray(env2.test2)).is.true
        expect(env2.test2 == null).is.false

        expect(typeof env2.test3).is.equals("object")
        expect(Array.isArray(env2.test3)).is.false
        expect(env2.test3 == null).is.false

        expect(typeof env2.test4).is.equals("object")
        expect(Array.isArray(env2.test4)).is.true
        expect(env2.test4 == null).is.false

        expect(typeof env2.test5).is.equals("object")
        expect(Array.isArray(env2.test5)).is.false
        expect(env2.test5 == null).is.true
    })

    it("json environment test", async () => {
        const env = new Environment({
            loadProcessEnv: false,
        })

        const defaultEnv = {
            test1: "{}",
            test2: "123",
            test3: "null",
            test4: "false",
        }
        env.define("test1", "json:object", "null", "number", "boolean")
        env.define("test2", "number", "boolean", "json:object", "null")
        env.define("test3", "null", "number", "boolean", "json:object")
        env.define("test4", "boolean", "json:object", "number", "null")

        const env2 = env.parseEnv(defaultEnv)

        expect(typeof env2.test1).is.equals("object")
        expect(Array.isArray(env2.test1)).is.false
        expect(env2.test1 == null).is.false

        expect(typeof env2.test2).is.equals("number")

        expect(typeof env2.test3).is.equals("object")
        expect(Array.isArray(env2.test3)).is.false
        expect(env2.test3 == null).is.true

        expect(typeof env2.test4).is.equals("boolean")
    })
})

export function createCatchPromise<T>(p: Promise<T>): Promise<T | Error | any> {
    return new Promise<T | Error | any>((res) => {
        p
            .then((t: T) => res(t))
            .catch((err: Error | any) => res(err))
    })
}
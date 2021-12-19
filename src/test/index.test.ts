import "mocha"
import "chai"

import {
    EnvError,
    EnvironmentParser,
    emailRegex
} from "../index"
import { expect } from "chai"
import { exec } from "child_process"

describe('Test typenvy EnvironmentParser class', () => {

    it("basic EnvironmentParser test", async () => {
        const env = new EnvironmentParser({
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

        const result = env.parseEnv(defaultEnv, {})
        if (result.exe) {
            result.exe()
        }
        const env2 = result.env

        expect(typeof result).is.equals("object")
        expect(typeof env2).is.equals("object")

        expect(typeof env2.testvalue).is.equals("string")
        expect(typeof env2.test2value).is.equals("string")
        expect(typeof env2.undefinedType).is.equals("undefined")
        expect(typeof env2.somevalue).is.equals("object")
        expect(typeof env2.numbervalue).is.equals("number")
        expect(typeof env2.booleanvalue).is.equals("boolean")
        expect(typeof env2.number2value).is.equals("number")
        expect(typeof env2.boolean2value).is.equals("boolean")
    })

    it("error EnvironmentParser test", async () => {
        const env = new EnvironmentParser({
            loadProcessEnv: false,
        })

        const defaultEnv = {
            somevalue: { test: [] },
        }
        env.define("testvalue", "string")
        env.require("somevalue", "string",)

        const result = await createCatchPromise((async () => {
            return env.parseEnv({}, defaultEnv)
        })())

        expect(typeof result.exe).is.equals("function")
        expect(typeof result.err).is.equals("object")
        expect(result.err instanceof Error).is.true
        expect(EnvError.isEnvError(result.err)).is.true
        expect(typeof result.err.message).is.equals("string")
    })

    it("json EnvironmentParser test", async () => {
        const env = new EnvironmentParser({
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

        const result = env.parseEnv(defaultEnv)
        if (result.exe) {
            result.exe()
        }
        const env2 = result.env

        expect(typeof result).is.equals("object")
        expect(typeof env2).is.equals("object")

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

    it("json EnvironmentParser test", async () => {
        const env = new EnvironmentParser({
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

        const result = env.parseEnv(defaultEnv)
        if (result.exe) {
            result.exe()
        }
        const env2 = result.env

        expect(typeof result).is.equals("object")
        expect(typeof env2).is.equals("object")

        expect(typeof env2.test1).is.equals("object")
        expect(Array.isArray(env2.test1)).is.false
        expect(env2.test1 == null).is.false

        expect(typeof env2.test2).is.equals("number")

        expect(typeof env2.test3).is.equals("object")
        expect(Array.isArray(env2.test3)).is.false
        expect(env2.test3 == null).is.true

        expect(typeof env2.test4).is.equals("boolean")
    })

    const testPaths = {
        pathu1: "/home/test/some/path",
        pathu2: "\\home\\test\\some\\path",
        pathu3: "./some/path",
        pathd1: "C:\\User\\halsm\\Desktop\\test",
        pathd2: "C:/User/halsm/Desktop/test",
        pathd3: ".\\Desktop\\test",
    }

    it("unix path regex EnvironmentParser test", async () => {
        const env = new EnvironmentParser({
            loadProcessEnv: false,
        })

        env.define("pathu1", "path:notexist")
        env.define("pathu2", "path:notexist")
        env.define("pathu3", "path:notexist")
        env.define("pathd1", "path:notexist")
        env.define("pathd2", "path:notexist")
        env.define("pathd3", "path:notexist")

        const result = env.parseEnv(testPaths)
        if (result.exe) {
            result.exe()
        }
        const env2 = result.env

        expect(typeof result).is.equals("object")
        expect(typeof env2).is.equals("object")

        expect(typeof env2.pathu1).is.equals("string")
        expect(typeof env2.pathu2).is.equals("string")
        expect(typeof env2.pathu3).is.equals("string")
        expect(typeof env2.pathd1).is.equals("string")
        expect(typeof env2.pathd2).is.equals("string")
        expect(typeof env2.pathd3).is.equals("string")

        expect(env2.pathu1).is.equals("/home/test/some/path")
        expect(env2.pathu2).is.equals("/home/test/some/path")
        expect(env2.pathu3).is.equals("/some/path")
        expect(env2.pathd1).is.equals("C:/User/halsm/Desktop/test")
        expect(env2.pathd2).is.equals("C:/User/halsm/Desktop/test")
        expect(env2.pathd3).is.equals("/Desktop/test")

    })

    it("dos path regex EnvironmentParser test", async () => {
        const env = new EnvironmentParser({
            loadProcessEnv: false,
        })

        env.define("pathu1", "path")
        env.define("pathu2", "path")
        env.define("pathu3", "path")
        env.define("pathd1", "path")
        env.define("pathd2", "path")
        env.define("pathd3", "path")

        const result = env.parseEnv(testPaths)
        if (result.exe) {
            result.exe()
        }
        const env2 = result.env

        expect(typeof result).is.equals("object")
        expect(typeof env2).is.equals("object")

        expect(typeof env2.pathu1).is.equals("string")
        expect(typeof env2.pathu2).is.equals("string")
        expect(typeof env2.pathu3).is.equals("string")
        expect(typeof env2.pathd1).is.equals("string")
        expect(typeof env2.pathd2).is.equals("string")
        expect(typeof env2.pathd3).is.equals("string")

        expect(env2.pathu1).is.equals("/home/test/some/path")
        expect(env2.pathu2).is.equals("/home/test/some/path")
        expect(env2.pathu3).is.equals("/some/path")
        expect(env2.pathd1).is.equals("C:/User/halsm/Desktop/test")
        expect(env2.pathd2).is.equals("C:/User/halsm/Desktop/test")
        expect(env2.pathd3).is.equals("/Desktop/test")
    })

    it("email regex EnvironmentParser test", async () => {
        const testEmails = {
            email1: "halsmaulmajo@coreunit.net",
            email2: "halsmaulmajo@gmail.com",
            email3: "majo@coreunit.net",
            email4: "example@example.com",
            email5: "qwer@domain.org",
        }

        expect(emailRegex.test("test")).is.false
        expect(emailRegex.test("w.qöä@p34t8324@ät83ä´4üt8qä@3ßt4")).is.false
        expect(emailRegex.test("öp3a4@giuz3p.09tgu3ßäö54guäa3c")).is.false
        expect(emailRegex.test("p-43t9783p.ö4@t73äpt7p")).is.false

        expect(emailRegex.test(testEmails.email1)).is.true
        expect(emailRegex.test(testEmails.email2)).is.true
        expect(emailRegex.test(testEmails.email3)).is.true
        expect(emailRegex.test(testEmails.email4)).is.true
        expect(emailRegex.test(testEmails.email5)).is.true

    })
})

export function createCatchPromise<T>(p: Promise<T>): Promise<T | Error | any> {
    return new Promise<T | Error | any>((res) => {
        p
            .then((t: T) => res(t))
            .catch((err: Error | any) => res(err))
    })
}
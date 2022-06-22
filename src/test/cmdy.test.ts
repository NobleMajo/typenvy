import "mocha"
import { expect } from "chai"
import { cmdyFlag } from "../cmdy"
import { fullTypeOf } from "../index"
import * as typenvy from "../index"
import { VariablesTypes } from '../index';
import { exampleChecker, exampleSourceEnv } from "./example";
import { uniqueStringify } from './json';
import { BoolFlag } from '../cmdy';
import { ValueFlag } from '../cmdy';

describe('Check cmdyFlag() method', () => {
    it("single boolean cmdy flag", async function () {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        const data = typenvy
            .parseEnv(sourceEnv, checker)
            .errThrow()
            .clearProcessEnv()

        const flag: BoolFlag = cmdyFlag(
            {
                name: "verbose",
                description: "Set the verbose data",
                shorthand: "v",
            },
            "VERBOSE",
            data
        )

        await flag.exe({}, undefined)
        expect(flag.name).is.equals("verbose")
        expect(flag.description).is.equals("Set the verbose data (default: 'true', ENV: 'VERBOSE')")
        expect(flag.shorthand).is.equals("v")
        expect(data.env["VERBOSE"]).is.false
    })

    it("multiple boolean cmdy flag", async function () {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        const data = typenvy
            .parseEnv(sourceEnv, checker)
            .errThrow()
            .clearProcessEnv()

        const flag1: BoolFlag = cmdyFlag(
            {
                name: "verbose",
                description: "Set the verbose data",
                shorthand: "v",
            },
            "VERBOSE",
            data
        )

        const flag2: BoolFlag = cmdyFlag(
            {
                name: "ignore",
                description: "ignore2",
                shorthand: "i",
            },
            "IGNORE_EMPTY_CERT",
            data
        )


        const flag3: BoolFlag = cmdyFlag(
            {
                name: "prod",
                description: "prod2",
                shorthand: "p",
            },
            "PRODUCTION",
            data
        )

        await flag1.exe({}, undefined)
        await flag3.exe({}, undefined)
        expect(flag1.name).is.equals("verbose")
        expect(flag1.description).is.equals("Set the verbose data (default: 'true', ENV: 'VERBOSE')")
        expect(flag1.shorthand).is.equals("v")
        expect(data.env["VERBOSE"]).is.false

        expect(flag2.name).is.equals("ignore")
        expect(flag2.description).is.equals("ignore2 (default: 'true', ENV: 'IGNORE_EMPTY_CERT')")
        expect(flag2.shorthand).is.equals("i")
        expect(data.env["IGNORE_EMPTY_CERT"]).is.true

        expect(flag3.name).is.equals("prod")
        expect(flag3.description).is.equals("prod2 (default: 'false', ENV: 'PRODUCTION')")
        expect(flag3.shorthand).is.equals("p")
        expect(data.env["PRODUCTION"]).is.true
    })

    it("string flag", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        const envData = typenvy
            .parseEnv(sourceEnv, checker)
            .errThrow()
            .clearProcessEnv()

        let flag: ValueFlag = cmdyFlag(
            {
                name: "example-string-value",
                description: "an example",
                types: ["string"]
            },
            "STATIC_PATH",
            envData,
        )

        expect(flag).is.not.undefined

        flag.exe = typeof flag.exe as any

        expect(uniqueStringify(
            flag
        )).is.equals(uniqueStringify({
            name: 'example-string-value',
            description: "an example (default: './public', ENV: 'STATIC_PATH')",
            types: ['string'],
            exe: "function"
        }))
    })

    it("boolean flag", () => {
        let sourceEnv: typeof exampleSourceEnv = { ...exampleSourceEnv }
        let checker: VariablesTypes = { ...exampleChecker }

        const envData = typenvy
            .parseEnv(sourceEnv, checker)
            .errThrow()
            .clearProcessEnv()

        let flag: BoolFlag = cmdyFlag(
            {
                name: "example-boolean-value",
                description: "an example 2",
            },
            "STATIC_DIR",
            envData,
        )

        expect(flag).is.not.undefined

        flag.exe = typeof flag.exe as any

        expect(uniqueStringify(
            flag
        )).is.equals(uniqueStringify({
            name: 'example-boolean-value',
            description: "an example 2 (ENV: 'STATIC_DIR')",
            exe: "function"
        }))
    })
})

import "mocha"
import { expect } from "chai"

import { EnvData, parseEnv } from "../index"
import { BoolFlag, cmdyFlag } from "../cmdy"
import { exampleChecker, exampleSourceEnv } from "./example";
import { ValueFlag } from "cmdy";
import { uniqueStringify } from './json';

describe('Check "cmdFlag()" method', () => {
    let envData: EnvData<typeof exampleSourceEnv>

    beforeEach(() => {
        envData = parseEnv(
            { ...exampleSourceEnv },
            { ...exampleChecker }
        )
            .errThrow()
            .clearProcessEnv()
            .getData()
    })

    it("string flag", () => {
        const stringFlag: ValueFlag = {
            name: "example-string-value",
            description: "an example",
            types: ["string"]
        }

        let flag = cmdyFlag(
            stringFlag,
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
        const booleanFlag: BoolFlag = {
            name: "example-boolean-value",
            description: "an example 2",
        }

        let flag = cmdyFlag(
            booleanFlag,
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

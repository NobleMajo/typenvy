
import { EnvironmentParser } from "../src/index"

import defaultEnv from "./backend.env"

export const envParser = new EnvironmentParser()
envParser.defineCustomType(
    "percent",
    (value) => {
        let v = Number(value)
        if (
            !isNaN(v) &&
            v >= 0 &&
            v <= 1
        ) {
            return v
        }
    }
)

envParser.define("PORT", "number")
envParser.require("SECRET", "string")
envParser.define("POSTGRES_HOST", "string")
envParser.define("POSTGRES_PORT", "number")
envParser.define("POSTGRES_USER", "string")
envParser.define("POSTGRES_PASSWORD", "string")
envParser.define("POSTGRES_DB", "string")

export const env = envParser.parseEnv(defaultEnv)
if (env.exe) {
    env.exe()
}
export default env.env


import { Environment } from "../src/index"

import defaultEnv from "./postgres.env"

const env = new Environment()
env.defineCustomRegexType(
    "test",
    ``
)
env.defineCustomType(
    "two",
    (value) => ("" + value) == "2" ? 2 : undefined
)

env.define("PORT", "number")
env.define("SECRET", "string")
env.require("POSTGRES_HOST", "string")
env.define("POSTGRES_PORT", "number")

console.log("dev: ", defaultEnv)

export default env.parseEnv(defaultEnv)

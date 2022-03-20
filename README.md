# typenvy

![uses npm](https://img.shields.io/npm/v/typenvy.svg?style=plastic&logo=npm&color=red)
![uses typescript](https://img.shields.io/badge/dynamic/json?style=plastic&color=blue&label=Typescript&prefix=v&query=devDependencies.typescript&url=https%3A%2F%2Fraw.githubusercontent.com%2FHalsMaulMajo%2Ftypenvy%2Fmain%2Fpackage.json)
![uses github](https://img.shields.io/badge/dynamic/json?style=plastic&color=darkviolet&label=GitHub&prefix=v&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2FHalsMaulMajo%2Ftypenvy%2Fmain%2Fpackage.json)

![](https://img.shields.io/badge/dynamic/json?color=darkred&label=open%20issues&query=open_issues&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2FHalsMaulMajo%2Ftypenvy)
![](https://img.shields.io/badge/dynamic/json?color=navy&label=forks&query=forks&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2FHalsMaulMajo%2Ftypenvy)
![](https://img.shields.io/badge/dynamic/json?color=green&label=subscribers&query=subscribers_count&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2FHalsMaulMajo%2Ftypenvy)

"typenvy" is a environment managment library 

# table of contents 
- [typenvy](#typenvy)
- [table of contents](#table-of-contents)
- [Features](#features)
  - [General](#general)
  - [Getting started](#getting-started)
    - [1. install typenvy](#1-install-typenvy)
    - [2. env file](#2-env-file)
    - [3. env parser](#3-env-parser)
    - [4. load and print env in "./src/index.ts"](#4-load-and-print-env-in-srcindexts)
    - [5. start](#5-start)
      - [1. Set environment variables](#1-set-environment-variables)
      - [2. Allow undefined as value](#2-allow-undefined-as-value)
      - [3. Set a default value](#3-set-a-default-value)
- [contribution](#contribution)

# Features

## General
 - Set default (typed) environment varables
 - Define variables types
 - Defined required variables
 - Load and parse variables from process.env

## Getting started
### 1. install typenvy
```sh
npm i typenvy
```

### 2. env file
Create a example environment file at "./src/env/env.ts":
```ts
import * as typenvy from "typenvy"
export const defaultEnv = {
    PRODUCTION: (process.env.NODE_ENV === "production") as boolean,
    VERBOSE: false as boolean,

    PORT: 8080 as number,
    API_KEY: undefined as string,
    API_URL: undefined as string,
}
export const variablesTypes: typenvy.VariablesTypes = {
    PRODUCTION: [typenvy.TC_BOOLEAN],
    VERBOSE: [typenvy.TC_BOOLEAN],

    PORT: [typenvy.TC_NUMBER],
    API_KEY: [typenvy.TC_STRING],
    API_URL: [typenvy.TC_STRING],
}
``` 

### 3. env parser
Create a example environment parser file at "./src/env/envParser.ts":
```ts
import { parseEnv } from "typenvy"
import { defaultEnv, variablesTypes } from "./env"

export const env = parseEnv(defaultEnv, variablesTypes)
  .setProcessEnv()
  .errExit()
  .env
export default env

if (!env.PRODUCTION) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
}
```

### 4. load and print env in "./src/index.ts"
```ts
import env from "./env/envParser"

console.log("parser env: ", {
  prod: env.PRODUCTION,
  v: env.VERBOSE,
  port: env.PORT,
  key: env.API_KEY,
  url: env.API_URL,
})

console.log("process env: ", {
  prod: process.env.PRODUCTION,
  v: process.env.VERBOSE,
  port: process.env.PORT,
  key: process.env.API_KEY,
  url: process.env.API_URL,
})
```

### 5. start
If you run the index.js after compile the app throws an error.
This is because in the "env.ts" there is no default value provided for "API_KEY" and "API_URL".

There are 3 options to remove this error:
#### 1. Set environment variables
```sh
export API_KEY="qwertzui"
export API_URL="https://api.github.io/v2/repo/majo418/testrepo"
```
#### 2. Allow undefined as value
Allow undefined as environment variable value in env.ts
```ts
export const variablesTypes: typenvy.VariablesTypes = {
    PRODUCTION: [typenvy.TC_BOOLEAN],
    VERBOSE: [typenvy.TC_BOOLEAN],

    PORT: [typenvy.TC_NUMBER],
    API_KEY: [typenvy.TC_STRING, typenvy.TC_UNDEFINED], // <---
    API_URL: [typenvy.TC_STRING, typenvy.TC_UNDEFINED], // <---
}
```
#### 3. Set a default value
Allow undefined as environment variable value in env.ts
```ts
export const defaultEnv = {
    PRODUCTION: (process.env.NODE_ENV === "production") as boolean,
    VERBOSE: false as boolean,

    PORT: 8080 as number,
    API_KEY: "myDEfaultAPIkey" as string,
    API_URL: "https://api.cloudflare.com/v1/dns" as string,
}
```

# contribution
 - 1. fork the project
 - 2. implement your idea
 - 3. create a pull/merge request
```ts
// please create seperated forks for different kind of featues/ideas/structure changes/implementations
```

---
**cya ;3**  
*by HalsMaulMajo*
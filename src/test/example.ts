import * as typenvy from "../index"
import { VariablesTypes } from '../index';

export const exampleSourceEnv = {
    PRODUCTION: false as boolean,
    VERBOSE: true as boolean,

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
    DNS_SERVER_ADDRESSES: [typenvy.TC_JSON_ARRAY, typenvy.TC_CSV_ARRAY],
    HTTP_PORT: [typenvy.TC_PORT],
    HTTPS_PORT: [typenvy.TC_PORT],
    BIND_ADDRESS: [typenvy.TC_STRING],
    CERT_PATH: [typenvy.TC_PATH],
    KEY_PATH: [typenvy.TC_PATH],
    CA_PATH: [typenvy.TC_PATH],
    IGNORE_EMPTY_CERT: [typenvy.TC_BOOLEAN],
    STATIC_PATH: [typenvy.TC_PATH],
}
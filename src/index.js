"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TC_CALCULATION = exports.TC_EMPTY_STRING = exports.TC_STRING = exports.TC_PATH_NOT_EXIST = exports.TC_PATH_EXIST = exports.TC_PATH_FILE = exports.TC_PATH_DIR = exports.TC_PATH = exports.TC_URL = exports.TC_URL_HTTP = exports.TC_EMAIL = exports.TC_NUMBER = exports.TC_BOOLEAN = exports.TC_NULL = exports.TC_ARRAY = exports.TC_OBJECT = exports.TC_JSON_VALUE = exports.parseEnv = exports.parseValue = exports.EnvResult = exports.anyToString = exports.emailRegex = exports.cmdFlag = void 0;
const url_1 = require("url");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
function cmdFlag(flag, envKey, envTypes, env, ignoreErrors = false) {
    return Object.assign(Object.assign({}, flag), { exe(cmd, value) {
            return __awaiter(this, void 0, void 0, function* () {
                value = parseValue(value !== null && value !== void 0 ? value : "true", envTypes[envKey]);
                if (value == undefined) {
                    if (!ignoreErrors) {
                        throw new Error("The flag '" +
                            flag.name +
                            "' is not type of '" +
                            envTypes[envKey].map((c) => c.type).join("', '") +
                            "'");
                    }
                }
                env[envKey] = value;
                process.env[envKey] = "" + value;
                if (flag.exe) {
                    yield flag.exe(cmd, value);
                }
            });
        } });
}
exports.cmdFlag = cmdFlag;
exports.emailRegex = /^(([^<>()\[\]\\.,:\s@"]+(\.[^<>()\[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function anyToString(value) {
    return value && typeof value.toString == "function" ?
        value.toString() :
        "" + value;
}
exports.anyToString = anyToString;
class EnvResult {
    constructor(env, errors) {
        this.env = env;
        this.errors = errors;
    }
    overwriteEnv(env) {
        Object.keys(env).forEach((key) => {
            this.env[key] = env[key];
        });
        return this;
    }
    setMissingEnv(env) {
        Object.keys(env).forEach((key) => {
            if (!this.env[key]) {
                this.env[key] = env[key];
            }
        });
        return this;
    }
    setProcessEnv() {
        Object.keys(this.env).forEach((key) => {
            process.env[key] = anyToString(this.env[key]);
        });
        return this;
    }
    clearProcessEnv(justEqualValues = true) {
        Object.keys(this.env).forEach((key) => {
            if (justEqualValues &&
                this.env[key] != process.env[key]) {
                return;
            }
            delete process.env[key];
        });
        return this;
    }
    errPrint() {
        var _a, _b;
        if (this.errors.length > 0) {
            console.log("Environment Errors:");
            for (let index = 0; index < this.errors.length; index++) {
                const error = this.errors[index];
                console.log("########## [ " + error[0] + " ]:");
                console.log(((_b = (_a = error[1].stack) !== null && _a !== void 0 ? _a : error[1].message) !== null && _b !== void 0 ? _b : anyToString(error[1]))
                    .split("\n")
                    .filter((v) => v.length != 0 && v != " ")
                    .join("\n")
                    .split("\n\n")
                    .join("\n"));
            }
        }
        return this;
    }
    errThrow() {
        if (this.errors.length > 0) {
            this.errPrint();
            throw new Error("Error in environment variables");
        }
        return this;
    }
    errExit(exitCode = 1) {
        if (this.errors.length > 0) {
            this.errPrint();
            process.exit(exitCode);
        }
        return this;
    }
}
exports.EnvResult = EnvResult;
function parseValue(value, checker) {
    for (let index = 0; index < checker.length; index++) {
        const newValue = checker[index].check(value);
        if (newValue != undefined) {
            return newValue;
        }
    }
    return undefined;
}
exports.parseValue = parseValue;
function parseEnv(defaultEnv, types) {
    var _a, _b;
    const env = Object.assign({}, defaultEnv);
    const errors = [];
    const varNames = Object.keys(types);
    for (let index = 0; index < varNames.length; index++) {
        const varName = varNames[index];
        const value = parseValue((_b = (_a = process.env[varName]) !== null && _a !== void 0 ? _a : env[varName]) !== null && _b !== void 0 ? _b : undefined, types[varName]);
        if (value == undefined) {
            errors.push([
                varName,
                new Error("The environment variable '" +
                    varName +
                    "' is not type of '" +
                    types[varName].map((c) => c.type).join("', '") +
                    "'")
            ]);
            continue;
        }
        env[varName] = value;
    }
    return new EnvResult(env, errors);
}
exports.parseEnv = parseEnv;
exports.TC_JSON_VALUE = {
    check: (value) => {
        if (typeof value == "string") {
            try {
                value = JSON.parse(value);
            }
            catch (err) {
            }
        }
        if (value == null ||
            typeof value == "boolean" ||
            typeof value == "number" ||
            typeof value == "string") {
            return value;
        }
        return undefined;
    },
    type: "JSON_VALUE"
};
exports.TC_OBJECT = {
    check: (value) => {
        if (typeof value == "string" &&
            value.length > 0) {
            try {
                value = JSON.parse(value);
            }
            catch (err) {
            }
        }
        if (typeof value == "object" &&
            !Array.isArray(value) &&
            value != null) {
            return value;
        }
        return undefined;
    },
    type: "OBJECT"
};
exports.TC_ARRAY = {
    check: (value) => {
        if (typeof value == "string" &&
            value.length > 0) {
            try {
                value = JSON.parse(value);
            }
            catch (err) {
            }
        }
        if (Array.isArray(value)) {
            return value;
        }
        return undefined;
    },
    type: "ARRAY"
};
exports.TC_NULL = {
    check: (value) => {
        if (value == null ||
            (typeof value == "string" &&
                value.toLowerCase() == "null")) {
            return null;
        }
    },
    type: "NULL"
};
exports.TC_BOOLEAN = {
    check: (value) => {
        if (typeof value == "boolean") {
            return value;
        }
        else if (typeof value == "string") {
            if (value.toLowerCase() == "true") {
                return true;
            }
            else if (value.toLowerCase() == "false") {
                return true;
            }
        }
        return undefined;
    },
    type: "BOOLEAN"
};
exports.TC_NUMBER = {
    check: (value) => {
        if (typeof value == "number") {
            return value;
        }
        const obj = Number(value);
        if (!isNaN(obj)) {
            return obj;
        }
        return undefined;
    },
    type: "NUMBER"
};
exports.TC_EMAIL = {
    check: (value) => {
        if (typeof value == "string" &&
            value.match(exports.emailRegex)) {
            return value;
        }
        return undefined;
    },
    type: "EMAIL"
};
exports.TC_URL_HTTP = {
    check: (value) => {
        try {
            const url = new url_1.URL(value);
            if (url.protocol != "http" &&
                url.protocol != "https") {
                return undefined;
            }
            const value2 = url.toString();
            if (typeof value2 == "string" &&
                value2.length > 0) {
                return value2;
            }
        }
        catch (err) {
        }
        return undefined;
    },
    type: "URL_HTTP"
};
exports.TC_URL = {
    check: (value) => {
        try {
            const url = new url_1.URL(value);
            const value2 = url.toString();
            if (typeof value2 == "string" &&
                value2.length > 0) {
                return value2;
            }
        }
        catch (err) {
        }
        return undefined;
    },
    type: "URL"
};
exports.TC_PATH = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/");
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value;
                    }
                    value = process.cwd() + value;
                }
            }
            else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value;
            }
            value = path.normalize(value);
            return value;
        }
        return undefined;
    },
    type: "PATH"
};
exports.TC_PATH_DIR = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/");
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value;
                    }
                    value = process.cwd() + value;
                }
            }
            else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value;
            }
            value = path.normalize(value);
            try {
                const stat = fs.statSync(value);
                if (stat && stat.isDirectory()) {
                    return value;
                }
            }
            catch (err) {
                if (typeof err.message == "string" &&
                    err.message.includes("no such file or directory")) {
                    return undefined;
                }
                throw err;
            }
        }
        return undefined;
    },
    type: "PATH_DIR"
};
exports.TC_PATH_FILE = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/");
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value;
                    }
                    value = process.cwd() + value;
                }
            }
            else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value;
            }
            value = path.normalize(value);
            try {
                const stat = fs.statSync(value);
                if (stat && stat.isFile()) {
                    return value;
                }
            }
            catch (err) {
                if (typeof err.message == "string" &&
                    err.message.includes("no such file or directory")) {
                    return undefined;
                }
                throw err;
            }
        }
        return undefined;
    },
    type: "PATH_FILE"
};
exports.TC_PATH_EXIST = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/");
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value;
                    }
                    value = process.cwd() + value;
                }
            }
            else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value;
            }
            value = path.normalize(value);
            try {
                const stat = fs.statSync(value);
                if (stat &&
                    (stat.isFile() ||
                        stat.isDirectory())) {
                    return value;
                }
            }
            catch (err) {
                if (typeof err.message == "string" &&
                    err.message.includes("no such file or directory")) {
                    return undefined;
                }
                throw err;
            }
        }
        return undefined;
    },
    type: "PATH_EXIST"
};
exports.TC_PATH_NOT_EXIST = {
    check: (value) => {
        if (typeof value == "string") {
            value = value.split("\\").join("/")
                .split("//").join("/");
            if (os.platform() == "win32") {
                if (value[1] != ":" && value[2] != "/") {
                    if (!value.startWith("/")) {
                        value = "/" + value;
                    }
                    value = process.cwd() + value;
                }
            }
            else if (!value.startsWith("/")) {
                value = process.cwd() + "/" + value;
            }
            value = path.normalize(value);
            try {
                const stat = fs.statSync(value);
                if (!stat ||
                    (!stat.isFile() &&
                        !stat.isDirectory())) {
                    return value;
                }
            }
            catch (err) {
                if (typeof err.message == "string" &&
                    err.message.includes("no such file or directory")) {
                    return value;
                }
                throw err;
            }
        }
        return undefined;
    },
    type: "PATH_NOT_EXIST"
};
exports.TC_STRING = {
    check: (value) => {
        if (typeof value == "string" &&
            value.length > 0) {
            return value;
        }
        return undefined;
    },
    type: "STRING"
};
exports.TC_EMPTY_STRING = {
    check: (value) => {
        if (typeof value == "string") {
            return value;
        }
        return undefined;
    },
    type: "EMPTY_STRING"
};
const allowedCalculationChars = "/*+-1234567890()";
exports.TC_CALCULATION = {
    check: (value) => {
        if (typeof value == "number") {
            return value;
        }
        const obj = Number(value);
        if (!isNaN(obj)) {
            return obj;
        }
        if (typeof value == "string") {
            for (const char of value) {
                if (!allowedCalculationChars.includes(char)) {
                    return undefined;
                }
            }
            const obj = Number(eval(value));
            if (!isNaN(obj)) {
                return obj;
            }
        }
        return undefined;
    },
    type: "NUMBER"
};

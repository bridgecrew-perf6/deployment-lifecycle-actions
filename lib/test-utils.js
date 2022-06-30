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
Object.defineProperty(exports, "__esModule", { value: true });
exports.stubContext = exports.stubCoreParams = exports.stubCreateIssue = exports.stubGH = exports.setupTests = void 0;
const sinon = __importStar(require("sinon"));
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
function wrapOutput(context) {
    // Function signature taken from Socket.write.
    // Note there are two overloads:
    // write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
    // write(str: Uint8Array | string, encoding?: string, cb?: (err?: Error) => void): boolean;
    return (chunk, encoding, cb) => {
        // Work out which method overload we are in
        if (cb === undefined && typeof encoding === "function") {
            cb = encoding;
            encoding = undefined;
        }
        // Record the output
        if (typeof chunk === "string") {
            context.testOutput += chunk;
        }
        else {
            context.testOutput += new TextDecoder(encoding || "utf-8").decode(chunk);
        }
        // Satisfy contract by calling callback when done
        if (cb !== undefined && typeof cb === "function") {
            cb();
        }
        return true;
    };
}
function setupTests(test) {
    const typedTest = test;
    typedTest.beforeEach((t) => {
        // Replace stdout and stderr so we can record output during tests
        t.context.testOutput = "";
        const processStdoutWrite = process.stdout.write.bind(process.stdout);
        t.context.stdoutWrite = processStdoutWrite;
        process.stdout.write = wrapOutput(t.context);
        const processStderrWrite = process.stderr.write.bind(process.stderr);
        t.context.stderrWrite = processStderrWrite;
        process.stderr.write = wrapOutput(t.context);
        // Many tests modify environment variables. Take a copy now so that
        // we reset them after the test to keep tests independent of each other.
        // process.env only has strings fields, so a shallow copy is fine.
        t.context.env = {};
        Object.assign(t.context.env, process.env);
    });
    typedTest.afterEach.always((t) => {
        // Restore stdout and stderr
        // The captured output is only replayed if the test failed
        process.stdout.write = t.context.stdoutWrite;
        process.stderr.write = t.context.stderrWrite;
        if (!t.passed) {
            process.stdout.write(t.context.testOutput);
        }
        // Undo any modifications made by sinon
        sinon.restore();
        // Undo any modifications to the env
        process.env = t.context.env;
    });
}
exports.setupTests = setupTests;
function stubGH() {
    return github.getOctokit("token");
}
exports.stubGH = stubGH;
function stubCreateIssue(gh, fail) {
    const spy = sinon.stub(gh.rest.issues, "createComment");
    if (fail) {
        spy.throws(new Error("some error message"));
    }
    else {
        spy.resolves();
    }
    return spy;
}
exports.stubCreateIssue = stubCreateIssue;
function stubCoreParams(values) {
    const spy = sinon.stub(core, "getInput");
    values.forEach(v => {
        if (v.isBool) {
            spy.withArgs(v.name).resolves(v.value.toLocaleLowerCase() === "true");
        }
        else {
            spy.withArgs(v.name).resolves(v.value);
        }
    });
}
exports.stubCoreParams = stubCoreParams;
function stubContext() {
    sinon.stub(github.context, "payload").value({ pull_request: "foo", label: "deploy to foo" });
}
exports.stubContext = stubContext;
//# sourceMappingURL=test-utils.js.map
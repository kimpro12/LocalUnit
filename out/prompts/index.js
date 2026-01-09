"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = buildPrompt;
const python_1 = require("./python");
const java_1 = require("./java");
const javascript_1 = require("./javascript");
function buildPrompt(args) {
    if (args.lang === "python") {
        return (0, python_1.pythonPrompt)({
            code: args.code,
            moduleName: args.moduleName,
            useParametrize: args.pythonUseParametrize,
            imports: args.imports
        });
    }
    if (args.lang === "java") {
        return (0, java_1.javaPrompt)({ code: args.code, symbolName: args.symbolName });
    }
    if (args.lang === "javascript") {
        return (0, javascript_1.javascriptPrompt)({ code: args.code, moduleName: args.moduleName, isTypeScript: false });
    }
    return (0, javascript_1.javascriptPrompt)({ code: args.code, moduleName: args.moduleName, isTypeScript: true });
}

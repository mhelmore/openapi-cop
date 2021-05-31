"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaDereferencingException = exports.SchemaValidationException = exports.ResponseParsingError = void 0;
class ResponseParsingError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.ResponseParsingError = ResponseParsingError;
class SchemaValidationException extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.SchemaValidationException = SchemaValidationException;
class SchemaDereferencingException extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.SchemaDereferencingException = SchemaDereferencingException;
//# sourceMappingURL=errors.js.map
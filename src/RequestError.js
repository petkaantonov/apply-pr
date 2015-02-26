"use strict";
var util = require("util");
var STATUS_CODES = require("http").STATUS_CODES;
function RequestError(url, code) {
    this.url = url;
    this.code = +code;
    this.message =
        this.url + " responded with " + this.code + " " + STATUS_CODES[code];
    Error.captureStackTrace(this, RequestError);
}
util.inherits(RequestError, Error);
RequestError.prototype.name = "RequestError";
module.exports = RequestError;

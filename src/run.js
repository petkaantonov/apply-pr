var Promise = require("bluebird");
var spawn = require("cross-spawn");
var path = require("path");

module.exports = function run(command, options) {
    var split = Array.isArray(command) ? command : command.split(" ");
    var cmd = split.shift();
    var args = split;
    options = Object(options);
    var stdin = options.stdin;
    var cwd = options.cwd;
    var log = !!options.log;
    if (typeof stdin !== "string") {
        stdin = null;
    }
    return new Promise(function(resolve, reject) {
        function makeResult(e) {
            var ret = e instanceof Error ? e : new Error(e + "");
            ret.stdout = out.trim();
            ret.stderr = err.trim();
            return ret;
        }

        var out = "";
        var err = "";
        var c = spawn(cmd, args, {stdio: ["pipe", "pipe", "pipe"], cwd: cwd || process.cwd()});

        if (stdin) {
            c.stdin.write(stdin);
            c.stdin.end();
        }

        c.stdout.on("data", function(data) {
            if (log) process.stdout.write(data.toString());
            out += data;
        });
        c.stderr.on("data", function(data) {
            if (log) process.stderr.write(data.toString());
            err += data;
        });

        c.on("error", function(err) {
            reject(makeResult(err));
        });
        c.on("close", function(code) {
            if (code == 0) resolve(makeResult())
            else reject(makeResult(cmd + " " + args.join(" ") + " exited with code: " + code + "\n" + err.trim()));
        })
    });
}

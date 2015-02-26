var run = require("./run");

exports.branch = function(ref) {
    if (ref == null) return Promise.resolve(null);
    return run(["git", "check-ref-format", ref + ""]).return(ref).catch(function() {
        throw new Error("'" + ref + "' is not a valid branch name");
    });
};

exports.remote = function(ref) {
    return run("git remote -v").then(function(remotes) {
        if (!remotes.stdout) {
            throw new Error("no remotes have been configured for this repository yet");
        }
        var isValid = remotes.stdout.split("\n").some(function(line) {
            return line.indexOf(ref) === 0;
        });

        if (!isValid) {
            throw new Error("'" + ref + "' is not a valid remote name");
        }
    }).return(ref);
};

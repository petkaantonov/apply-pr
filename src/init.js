var TIMEOUT = 5000;
var amArgs = [];
var args = require("optimist")
    .usage("Apply pull/merge requests.\nUsage: apply-pr [OPTIONS] pull-request-id [--] [git am OPTIONS]\n\n" +
           "Github authorization token is read from the GITHUB_TOKEN environment variable, \n" +
           "it is not needed for public repositories however.")

    .options('r', {
        alias: 'remote',
        default: 'origin',
        desc: "The remote from which the Pull Request is applied."
    })
    .options('b', {
        alias: 'branch',
        desc: "The branch where the Pull Request will be applied to."
    })
    .options('t', {
        alias: 'timeout',
        default: TIMEOUT,
        desc: "Time limit for fetching the pull request patch."
    })
    .check(function(argv) {
        var posArgs = argv._;
        if (!posArgs || posArgs.length < 1) {
            throw new Error("Pull Request id is required");
        }
        var prId = posArgs[0];
        if ((prId >>> 0) !== prId) {
            throw new Error("Pull Request id must be a positive integer");
        }
        amArgs = posArgs.slice(1);
    })
    .argv;
var Promise = require("bluebird");
Promise.longStackTraces();
var path = require("path");
var request = Promise.promisify(require("request"));
var fs = Promise.promisifyAll(require("fs"));
var authorization = process.env.GITHUB_TOKEN;
var E = require("core-error-predicates");
var RequestError = require("./RequestError");
var run = require("./run");
var util = require("util");
var parseRepo = require("./parse-repo");
var validateRef = require("./validateRef");

var pullRequestId = (args._[0] >>> 0);
var branch = validateRef.branch(args.branch);
var remote = validateRef.remote(args.remote);
var status = run("git status --porcelain", {log: false});
Promise.join(status, remote, branch, function(status, remote, branch) {
    if (status.stdout) {
        throw new Error("Your have uncommited/unstaged work in the working directory " +
                        "or you are in the middle of a merge/rebase/cherry-pick/am. " +
                        "Run `git status` for more information.");
    }
    var remoteConfig = run("git config --get remote." + remote + ".url");
    if (branch) {
        var branchSwitched = run("git checkout " + branch).catch(function(e) {
            if (e.stderr.indexOf("error: pathspec") !== 0) {
                throw e;
            }
            return run("git checkout -b " + branch);
        });
        return Promise.join(remoteConfig, branchSwitched).return(remoteConfig);
    }
    return remoteConfig;
})
.then(function(remoteConfig) {
    var url = remoteConfig.stdout;
    if (!url) {
        throw new Error("no url configured for the remote '" + remote + "'");
    }
    var repo = parseRepo(remote, url);
    var pullRequestUrl = util.format("https://github.com/%s/%s/pull/%s.patch",
                                     repo.owner,
                                     repo.project,
                                     pullRequestId);
    console.log("Applying Pull Request from:", pullRequestUrl);
    return request({
        url: pullRequestUrl,
        method: "GET",
        headers: {
            "User-Agent": repo.owner + "/" + repo.project,
            "Authorization": "token " + authorization
        }
    })
    .timeout(args.timeout)
    .spread(function(response, body) {
        var code = +response.statusCode;
        if (200 <= code && code <= 299) {
            return run(["git", "am"].concat(amArgs), {stdin: body});
        }
        throw new RequestError(pullRequestUrl, code);
    });
})
.catch(E.NetworkError, function(e) {
    console.error("Error: unable to connect to the network");
    process.exit(2);
})
.catch(E.FileNotFoundError, function(e) {
    if (e.syscall) {
        console.error("Error: " + e.path + " has not been installed");
    } else {
        console.error("Error: cannot find file or directory: " + e.path);
    }
    process.exit(2);
})
.catch(function(e) {
    console.error(e + "");
    process.exit(2);
});

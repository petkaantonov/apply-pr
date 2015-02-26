module.exports = function(remote, url) {
    var repoPattern = /github.com(?:[:\/])([^\/]+)\/(.+?)\.git$/;
    var result = repoPattern.exec(url);
    if (!result) {
        throw new Error("the remote '" + remote+ "' is not configured to a github repository");
    }
    return {
        owner: result[1],
        project: result[2]
    };
};

#Introduction

`apply-pr` is a cross-platform command-line tool for applying GitHub Pull Requests

#Requirements

Requires io.js or node.js installation and git.

```
npm install -g apply-pr
```

#Why?

Merging GitHub Pull Requests using the merge pull request button in the web-ui is the most convenient way but it makes the repository history  ugly - the original commit will show up in history not when it was actually merged but when the author originally commited it. Additionally
it creates an annoying merge commit which makes the history look non-linear in repository explorer like gitk.

Copy pasting urls and commands to command line to apply pull requests properly is annoying, when all it takes is the PR number which is easy to type and remember.

#Usage

```
Apply pull/merge requests.
Usage: apply-pr [OPTIONS] pull-request-id [--] [git am OPTIONS]

Github authorization token is read from the GITHUB_TOKEN environment variable,
it is not needed for public repositories however.

Options:
  -r, --remote   The remote from which the Pull Request is applied.     [default: "origin"]
  -b, --branch   The branch where the Pull Request will be applied to.  [default: the current branch]
  -t, --timeout  Time limit for fetching the pull request patch.        [default: 30000]
```

Example:

```
petka@petka-VirtualBox ~/bluebird (3.0)
$ apply-pr 505
```

This would fetch and apply the pull request from https://github.com/petkaantonov/bluebird/pull/505 to the current branch (3.0)

You may append options for [`git-am(1)`](https://www.kernel.org/pub/software/scm/git/docs/git-am.html) after the double-dash:

```
$ apply-pr 505 -- --whitespace=fix
```

By default nothing is passed as an option to `git am`.

**Note** If the PR doesn't apply cleanly and you don't want to fix it you can always discard it by typing `git am --abort`.

#Safety

apply-pr will instantly abort if the working directory is not clean or if you are in the middle of a merge/rebase/am/cherry-pick.

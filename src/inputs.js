const core = require("@actions/core");

function stripRefs(input) {
  return input ? input.replace("refs/tags/", "") : input;
}

const inputs = {
  assets: core.getInput("assets"),
  body: core.getInput("body"),
  githubToken: core.getInput("github_token", { required: true }),
  prerelease: core.getInput("prerelease") === "true",
  previousReleaseSha: core.getInput("previous_release_sha"),
  publish: core.getInput("publish", { required: true }) === "true",
  releaseName: stripRefs(core.getInput("release_name")),
  tagName: stripRefs(core.getInput("tag_name", { required: true })),
  targetCommitish: core.getInput("target_commitish", { required: true }),
};

module.exports = inputs;

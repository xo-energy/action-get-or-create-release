const core = require("@actions/core");
const { context } = require("@actions/github");

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
  tagName: stripRefs(core.getInput("tag_name") || context.ref),
};
if (!inputs.tagName) throw new Error("Missing input 'tag_name' (and context.ref is undefined)");

module.exports = inputs;

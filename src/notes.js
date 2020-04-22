const core = require("@actions/core");
const { context } = require("@actions/github");

const issueParser = require("issue-parser")("github");
const mustache = require("mustache");

const template = `
# Changes
{{body}}
{{#commits}}
- {{sha}} {{message}} (@{{author}}{{#issues?}}; fixes{{#issues}} {{.}}{{/issues}}{{/issues?}})
{{/commits}}
`.trim();

function getClosers(message) {
  const parsed = issueParser(message);
  return parsed.actions.close;
}

async function getCommits(github, base, head) {
  if (!base || !head) return [];

  // compare commits with pagination
  let commits = [];
  try {
    const request = github.repos.compareCommits.endpoint.merge({
      owner: context.repo.owner,
      repo: context.repo.repo,
      base,
      head,
    });
    // eslint-disable-next-line no-restricted-syntax
    for await (const response of github.paginate.iterator(request)) {
      commits = commits.concat(response.data.commits);
    }
  } catch (e) {
    core.warning(`Failed to compare commits: ${e.message}`);
  }

  core.info(`Collected ${commits.length} since ${base}`);
  return commits;
}

async function getReleaseNotes(github, body, base, head) {
  const commitsRaw = await getCommits(github, base, head);

  // parse closing keywords from the commit messages
  const commits = commitsRaw.map((x) => {
    const issues = getClosers(x.commit.message);
    return {
      sha: x.sha,
      message: x.commit.message.split(/[\r\n]+/, 1).shift(),
      author: x.author.login,
      "issues?": issues.length,
      issues: issues.map((c) => `${c.slug || ""}${c.prefix}${c.issue}`),
    };
  });

  // template
  return mustache.render(template, {
    body,
    commits,
  });
}

module.exports = { getClosers, getCommits, getReleaseNotes };

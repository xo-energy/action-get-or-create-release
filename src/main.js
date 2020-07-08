const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");
const glob = require("@actions/glob");

const bytes = require("bytes");
const fs = require("fs");
const mime = require("mime-types");
const { basename } = require("path");

const inputs = require("./inputs");
const { getReleaseNotes } = require("./notes");

async function getOrCreateRelease(github) {
  try {
    const response = await github.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: inputs.tagName,
    });

    core.info(`Release ${inputs.tagName} already exists.`);
    return response.data;
  } catch (e) {
    if (e.status !== 404) {
      throw e;
    }

    // when creating a new release, try to generate release notes
    let body = inputs.body || "TBA";
    if (inputs.previousReleaseSha) {
      core.info("Generating release notes...");
      body = await getReleaseNotes(github, inputs.body, inputs.previousReleaseSha, context.sha);
    }

    core.info(`Creating release ${inputs.tagName}`);
    const response = await github.repos.createRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag_name: inputs.tagName,
      name: inputs.releaseName || inputs.tagName,
      body,
      prerelease: inputs.prerelease,
      draft: true,
    });
    return response.data;
  }
}

async function uploadAssets(github, uploadUrl, patterns) {
  const globber = await glob.create(patterns);
  const files = await globber.glob();

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const contentType = mime.lookup(file);
    const stat = fs.statSync(file);
    const read = fs.createReadStream(file);
    core.info(`Uploading asset '${file}' (${bytes(stat.size)} ${contentType})`);

    // do these one at a time to avoid throttling, etc.
    // eslint-disable-next-line no-await-in-loop
    await github.request(`POST ${uploadUrl}`, {
      name: basename(file),
      headers: {
        "content-type": contentType,
        "content-length": stat.size,
      },
      data: read,
    });
  }
}

async function run() {
  try {
    const github = new GitHub(inputs.githubToken);

    // gets an existing release or creates a new draft release
    const release = await getOrCreateRelease(github);

    // upload and attach assets to the release
    if (inputs.assets) {
      await uploadAssets(github, release.upload_url, inputs.assets);
    }

    // if we created a draft release, optionally publish it
    if (release.draft && inputs.publish) {
      core.info(`Publishing release ${release.name}`);
      await github.repos.updateRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: release.id,
        draft: false,
      });
    }

    // output the release's upload_url and id
    core.setOutput("release_id", release.id.toString());
    core.setOutput("upload_url", release.upload_url);
  } catch (e) {
    core.setFailed(e.message);
  }
}

run();

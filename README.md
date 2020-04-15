# GitHub Action - Get or Create Release

This GitHub Action (written in JavaScript) gets an existing GitHub release or creates a new one, optionally uploads asset attachments to the release, and optionally publishes the release.

## Usage

### Inputs

- `assets`: File glob expression(s) of assets to attach to the release.
- `body`: Text describing the contents of the release. Default to "TBA" when creating a new release.
- `github_token`: GitHub personal access token. Defaults to the token provided by the workflow run.
- `publish`: `true` to publish the release, `false` to leave as a draft. Defaults to `true`.
- `release_name`: Name of the release. Defaults to `tag_name`.
- `tag_name`: Tag from which to create the release. Defaults to `github.ref` (i.e. the tag that triggered this workflow run).

### Outputs

- `release_id`: The ID of the GitHub release.
- `upload_url`: The URL for uploading assets to the release.

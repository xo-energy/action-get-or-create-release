jest.mock("@actions/github", () => ({
  context: {
    repo: {
      owner: "org",
      repo: "project",
    },
  },
}));
jest.unmock("../src/notes");

const notes = require("../src/notes");

const issue57 = {
  action: "Fixes",
  slug: undefined,
  prefix: "#",
  issue: "57",
  raw: "fixes #57",
};
const issue58 = {
  action: "Fixes",
  slug: undefined,
  prefix: "#",
  issue: "58",
  raw: "fixes #58",
};
const issue59 = {
  action: "Resolves",
  slug: undefined,
  prefix: "#",
  issue: "59",
  raw: "resolves #59",
};
const issue60 = {
  action: "Closes",
  slug: "owner/repo",
  prefix: "#",
  issue: "60",
  raw: "closes owner/repo#60",
};

const mockCommits = [
  {
    sha: "abc",
    commit: {
      author: { name: "User1" },
      message: "Fix error\n\nfixes #1",
    },
    author: { login: "user" },
  },
  {
    sha: "def",
    commit: {
      author: { name: "User1" },
      message: "Add feature\n\ncloses #2",
    },
    author: { login: "user" },
  },
  {
    sha: "ghi",
    commit: {
      author: { name: "Contributor1" },
      message: "Add feature\n\nTwo birds with one stone!\n\ncloses #3, closes #4",
    },
    author: { login: "contributor" },
  },
  {
    sha: "xyz",
    commit: {
      author: { name: "User1" },
      message: "Cleanup",
    },
    author: { login: "user" },
  },
];

const mockGitHub = {
  rest: {
    repos: {
      compareCommits: {
        endpoint: {
          merge: jest.fn(),
        },
      },
    },
  },
  paginate: {
    iterator: jest.fn(),
  },
};

describe("getClosers", () => {
  test("works on empty message", () => {
    expect(notes.getClosers("")).toEqual([]);
  });
  test("finds issue number", () => {
    expect(notes.getClosers("Fix some things\n\nfixes #57")).toEqual([issue57]);
  });
  test("finds multiple issue numbers", () => {
    expect(notes.getClosers("Fix some things\n\nfixes #57, fixes #58")).toEqual([issue57, issue58]);
  });
  test("finds multiple issue numbers on multiple lines", () => {
    expect(notes.getClosers("Fix some things\n\nfixes #57\nfixes #58")).toEqual([issue57, issue58]);
  });
  test("finds 'resolves'", () => {
    expect(notes.getClosers("Fix some things\n\nresolves #59")).toEqual([issue59]);
  });
  test("finds 'closes' other repo", () => {
    expect(notes.getClosers("Fix some things\n\ncloses owner/repo#60")).toEqual([issue60]);
  });
});

describe("getReleaseNotes", () => {
  beforeAll(() => {
    mockGitHub.paginate.iterator.mockReturnValue({
      *[Symbol.iterator]() {
        yield { data: { commits: mockCommits } };
      },
    });
  });

  test("matches template", async () => {
    const output = await notes.getReleaseNotes(mockGitHub, null, "abc", "xyz");
    expect(output).toEqual(
      `
# Changes

- abc Fix error ([User1](https://github.com/org/project/commits?author=user); fixes #1)
- def Add feature ([User1](https://github.com/org/project/commits?author=user); fixes #2)
- ghi Add feature ([Contributor1](https://github.com/org/project/commits?author=contributor); fixes #3 #4)
- xyz Cleanup ([User1](https://github.com/org/project/commits?author=user))
`.trimLeft()
    );
  });
});

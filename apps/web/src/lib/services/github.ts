
const GITHUB_API_BASE = "https://api.github.com";

export type GitHubFileResponse = {
  sha: string;
  content: string; // Base64 encoded
  encoding: string;
};

export type CommitResult = {
  sha: string;
  url: string;
};

class GitHubService {
  private token: string;
  private owner: string;
  private repo: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || "";
    this.owner = process.env.GITHUB_REPO_OWNER || "divalsehgal";
    this.repo = process.env.GITHUB_REPO_NAME || "nextjs-template";
  }

  private async fetchGitHub(path: string, options: RequestInit = {}) {
    const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `token ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`GitHub API Error: ${error.message} (${response.status})`);
    }

    return response.json();
  }

  async getFile(path: string, branch = "main"): Promise<GitHubFileResponse> {
    return this.fetchGitHub(`/contents/${path}?ref=${branch}`);
  }

  async updateFile(
    path: string,
    content: string,
    message: string,
    sha: string,
    branch = "main"
  ): Promise<CommitResult> {
    const body = {
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
      branch,
    };

    return this.fetchGitHub(`/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async createBranch(newBranch: string, sourceBranch = "main"): Promise<any> {
    // Get source branch SHA
    const ref = await this.fetchGitHub(`/git/refs/heads/${sourceBranch}`);
    const sha = ref.object.sha;

    // Create new ref
    return this.fetchGitHub("/git/refs", {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${newBranch}`,
        sha,
      }),
    });
  }

  async createPullRequest(title: string, head: string, base = "main", body = ""): Promise<any> {
    return this.fetchGitHub("/pulls", {
      method: "POST",
      body: JSON.stringify({
        title,
        head,
        base,
        body,
      }),
    });
  }
}

export const github = new GitHubService();

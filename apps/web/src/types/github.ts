/**
 * GitHub API types.
 * Shapes returned by the GitHub REST API used in our service layer.
 */

export type GitHubFileResponse = {
    sha: string;
    content: string; // Base64 encoded
    encoding: string;
};

export type CommitResult = {
    sha: string;
    url: string;
};

import type { Project } from "./projects";

export interface RepoDetails {
  name: string;
  full_name: string;
  description: string;
  topics: string[];
  default_branch: string;
  html_url: string;
}

export const fetchRepoDetails = async (
  repoUrl: string
): Promise<RepoDetails | null> => {
  try {
    const urlParts = repoUrl.replace("https://github.com/", "").split("/");
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) return null;

    // Check for GITHUB_TOKEN (need to define this in your .env file)
    const token = import.meta.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );
    if (!response.ok) {
      // If 403 or 404, it might be rate limit or private.
      // We return null so the fallback data is used.
      console.warn(
        `GitHub fetch failed for ${owner}/${repo}: ${response.status}`
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch repo details for ${repoUrl}:`, error);
    return null;
  }
};

export const fetchRepoLanguages = async (repoUrl: string) => {
  try {
    const urlParts = repoUrl.replace("https://github.com/", "").split("/");
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) return [];

    const token = import.meta.env.GITHUB_TOKEN;
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      { headers }
    );
    if (!response.ok) return [];

    const data = await response.json();
    return Object.keys(data);
  } catch (error) {
    console.error(`Failed to fetch languages for ${repoUrl}:`, error);
    return [];
  }
};

export const fetchUserRepositoriesByTopic = async (
  username: string,
  topic: string
) => {
  try {
    const token = import.meta.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    // Search for repositories by user and topic
    // Sort by stars or updated? Let's sort by stars for "Selected Works" feel.
    const query = `user:${username} topic:${topic}`;
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(
        query
      )}&sort=stars&order=desc`,
      { headers }
    );

    if (!response.ok) {
      console.warn(`GitHub search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch repositories by topic:", error);
    return [];
  }
};

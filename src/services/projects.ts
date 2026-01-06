import {
  fetchRepoLanguages,
  fetchUserRepositoriesByTopic,
  fetchRepoDetails,
} from "./github";
import fs from "node:fs/promises";
import path from "node:path";
import projectsData from "../data/projects.json";

export interface Project {
  title: string;
  description: string;
  tags: string[];
  repoUrl: string;
  image: string;
  fallbackImage?: string;
  featured?: boolean;
  Lang: string[];
  imagePath?: string;
}

// Fallback is the JSON import
const localProjects: Project[] = projectsData;
const DATA_FILE_PATH = path.join(process.cwd(), "src/data/projects.json");

// The 7 repositories from the user's "porto" list (scraped/identified)
const PORTO_LIST_REPOS = [
  "terarush/StreetAI",
  "mel-cell/mellow-movie_TMDb-api",
  "mel-cell/coralwind",
  "mel-cell/docktop",
  "mel-cell/FastUnduh",
  "mel-cell/replas-banksampah",
  "mel-cell/Toko_Thrift-laravel",
];

export const getProjects = async (): Promise<Project[]> => {
  let shouldFetch = false;

  try {
    // Check file stats for "Weekly" update
    const stats = await fs.stat(DATA_FILE_PATH);
    const now = new Date();
    const lastModified = new Date(stats.mtime);
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

    if (now.getTime() - lastModified.getTime() > oneWeekInMs) {
      console.log("Projects cache is older than 1 week. Refreshing...");
      shouldFetch = true;
    } else {
      console.log("Using cached projects (fresh).");
      shouldFetch = true; // FORCE REFRESH to load new list
    }
  } catch (e) {
    console.log("Cache file checking failed, will try to fetch.", e);
    shouldFetch = true;
  }

  // If we don't need to fetch, return local
  if (!shouldFetch && localProjects.length > 0) {
    return localProjects;
  }

  // Fetch from GitHub based on the PORTO list
  try {
    console.log("Fetching specific 'porto' list projects from GitHub...");

    // Process each repo in the list
    const processedProjects = (
      await Promise.all(
        PORTO_LIST_REPOS.map(async (repoStr) => {
          const [owner, repoName] = repoStr.split("/");
          // We use the full URL to reuse existing helper, or just passing string?
          // Existing helpers rely on repoUrl or similar.
          // Let's manually construct the fetch since we know the structure.
          const url = `https://github.com/${repoStr}`;

          const details = await fetchRepoDetails(url);
          if (!details) return null; // Skip if failed

          const languages = await fetchRepoLanguages(url);

          // Determine image path
          let imagePath = "image.png";
          if (repoName === "StreetAI") imagePath = "demo/image.png";

          const dynamicImage = `https://raw.githubusercontent.com/${details.full_name}/${details.default_branch}/${imagePath}`;

          return {
            title: details.name.replace(/-/g, " ").replace(/_/g, " "),
            description: details.description || "No description available.",
            tags: details.topics || [],
            repoUrl: details.html_url,
            image: dynamicImage,
            fallbackImage: "/placeholder.png",
            featured:
              details.topics.includes("featured") || repoName === "docktop", // Auto-feature docktop
            Lang: languages,
            imagePath: imagePath,
          } as Project;
        })
      )
    ).filter((p): p is Project => p !== null); // Filter out nulls

    if (processedProjects.length > 0) {
      // Sort: featured first, then by stars/relevance (implicitly order of list?)
      // Let's keep the order of the list or sort by featured?
      // User list has its own order. Let's try to allow featured to bubble up.
      const sortedProjects = processedProjects.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });

      // Write to JSON file
      try {
        await fs.writeFile(
          DATA_FILE_PATH,
          JSON.stringify(sortedProjects, null, 2)
        );
        console.log("Projects cache updated successfully.");
        return sortedProjects;
      } catch (writeError) {
        console.error("Failed to write projects cache:", writeError);
        return sortedProjects;
      }
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }

  // If fetch failed, return fallback
  console.log("Falling back to local projects data.");
  return localProjects;
};

// Export localProjects for static fallback if needed
export const projects = localProjects;

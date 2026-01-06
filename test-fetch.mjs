import { fetchRepoDetails } from "./github.ts";
import "dotenv/config"; // Need to load env if not in Astro context, but complex in TS node.
// Actually, let's just use the fetch logic directly in a simple JS script to test connectivity.

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function testFetch() {
  const repo = "mel-cell/docktop";
  console.log(`Testing fetch for ${repo}...`);

  const token = GITHUB_TOKEN; // Ensure this is set in environment or pass it manually if needed for test.
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "TestScript",
  };
  // Note: Github API requires User-Agent usually. My code didn't set it explicitly in github.ts?
  // fetch in browser/node usually sets a default, but best to check.

  if (token) {
    console.log("Using token...");
    headers["Authorization"] = `token ${token}`;
  } else {
    console.log("No token found in env.");
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
    });
    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`Success! Found: ${data.name}`);
    } else {
      console.log("Failed:", await response.text());
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

testFetch();

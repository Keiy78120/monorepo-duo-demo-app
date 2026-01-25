const REQUIRED_CONFIRMATION = "je suis sur";

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function deleteGitHubRepo() {
  const token = getEnv("GITHUB_TOKEN");
  const owner = getEnv("GITHUB_REPO_OWNER");
  const repo = getEnv("GITHUB_REPO_NAME");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (response.status === 204) {
    return { ok: true };
  }

  const body = await response.text().catch(() => "");
  return { ok: false, status: response.status, error: body };
}

async function deleteVercelProject() {
  const token = getEnv("VERCEL_TOKEN");
  const projectId = getEnv("VERCEL_PROJECT_ID");
  const teamId = process.env.VERCEL_TEAM_ID;

  const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return { ok: true };
  }

  const body = await response.text().catch(() => "");
  return { ok: false, status: response.status, error: body };
}

async function run() {
  const confirmation = normalizeText(process.env.NUKE_CONFIRMATION || "");
  if (confirmation !== REQUIRED_CONFIRMATION) {
    console.error("Set NUKE_CONFIRMATION=je suis sûr to proceed.");
    process.exit(1);
  }

  const gh = await deleteGitHubRepo();
  const vz = await deleteVercelProject();

  console.log("GitHub:", gh);
  console.log("Vercel:", vz);

  if (!gh.ok || !vz.ok) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

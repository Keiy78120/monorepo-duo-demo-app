interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

interface VercelConfig {
  token: string;
  projectId: string;
  teamId?: string | null;
}

export interface NukeResult {
  github?: { ok: boolean; status?: number; error?: string };
  vercel?: { ok: boolean; status?: number; error?: string };
}

function buildVercelDeleteUrl(projectId: string, teamId?: string | null) {
  const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }
  return url.toString();
}

async function deleteGitHubRepo(config: GitHubConfig) {
  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (response.status === 204) {
    return { ok: true, status: response.status };
  }

  const body = await response.text().catch(() => "");
  return {
    ok: false,
    status: response.status,
    error: body || "GitHub deletion failed",
  };
}

async function deleteVercelProject(config: VercelConfig) {
  const response = await fetch(buildVercelDeleteUrl(config.projectId, config.teamId), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (response.ok) {
    return { ok: true, status: response.status };
  }

  const body = await response.text().catch(() => "");
  return {
    ok: false,
    status: response.status,
    error: body || "Vercel deletion failed",
  };
}

export async function runEmergencyNuke(): Promise<NukeResult> {
  const result: NukeResult = {};

  const githubToken = process.env.GITHUB_TOKEN;
  const githubOwner = process.env.GITHUB_REPO_OWNER;
  const githubRepo = process.env.GITHUB_REPO_NAME;

  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;
  const vercelTeamId = process.env.VERCEL_TEAM_ID || null;

  if (githubToken && githubOwner && githubRepo) {
    result.github = await deleteGitHubRepo({
      token: githubToken,
      owner: githubOwner,
      repo: githubRepo,
    });
  } else {
    result.github = {
      ok: false,
      error: "Missing GitHub configuration",
    };
  }

  if (vercelToken && vercelProjectId) {
    result.vercel = await deleteVercelProject({
      token: vercelToken,
      projectId: vercelProjectId,
      teamId: vercelTeamId,
    });
  } else {
    result.vercel = {
      ok: false,
      error: "Missing Vercel configuration",
    };
  }

  return result;
}

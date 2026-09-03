import { UpdateResponseFormatError } from "./update-feed.js";
import { parseVersion } from "./update-version.js";

export const GITHUB_UPDATE_OWNER = "youming-ai";
export const GITHUB_UPDATE_REPO = "OpenGrokBot";
export const DEFAULT_GITHUB_UPDATE_BASE_URL = `https://api.github.com/repos/${GITHUB_UPDATE_OWNER}/${GITHUB_UPDATE_REPO}`;
export const GITHUB_RELEASES_PAGE_URL = `https://github.com/${GITHUB_UPDATE_OWNER}/${GITHUB_UPDATE_REPO}/releases/latest`;

export interface GitHubUpdateManifest {
  readonly version: string;
  readonly url: string;
  readonly name: string;
  /** Marks a notify-style manifest: open the release page instead of downloading. */
  readonly releasePage: string;
}

export function isGitHubUpdateBaseUrl(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).hostname === "api.github.com";
  } catch {
    return false;
  }
}

export function buildGitHubUpdateRequestUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/releases/latest`;
}

function normalizeGitHubTag(tag: string): string {
  return tag.startsWith("v") ? tag.slice(1) : tag;
}

function validUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function parseGitHubReleaseResponse(payload: unknown): GitHubUpdateManifest {
  if (typeof payload !== "object" || payload === null) throw new UpdateResponseFormatError("expected an object");
  const value = payload as Record<string, unknown>;
  if (typeof value.tag_name !== "string" || value.tag_name.length === 0) {
    throw new UpdateResponseFormatError("tag_name must be a non-empty string");
  }
  if (!validUrl(value.html_url)) throw new UpdateResponseFormatError("html_url must be a valid URL");
  const version = normalizeGitHubTag(value.tag_name);
  if (parseVersion(version) == null) throw new UpdateResponseFormatError(`tag "${value.tag_name}" is not a comparable version`);
  const name = typeof value.name === "string" && value.name.length > 0 ? value.name : version;
  return { version, url: value.html_url, name, releasePage: value.html_url };
}

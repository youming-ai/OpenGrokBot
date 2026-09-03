import {
  SAND_ACCESS_CHECKING,
  SAND_ACCESS_UNKNOWN,
} from "../../shared/sand-access.js";

export const SAND_ACCESS_REQUEST_TIMEOUT_MS = 10_000;

export type SandAccessState = "granted" | "unavailable" | "paymentRequired" | "unknown";
export type SandAccessBlockReason =
  | "none"
  | "teamPrivacyMode"
  | "teamSetupRequired"
  | "teamAccessRequired"
  | "notOffered"
  | "freeTrialAvailable"
  | "paywallIndividual"
  | "paywallTeamMember"
  | "paywallTeamAdmin"
  | "unspecified";
export interface SandAccess { readonly state: SandAccessState | "checking"; readonly reason: SandAccessBlockReason }

export type CursorAuthStatus =
  | { readonly kind: "logging-in" }
  | { readonly kind: "logged-out"; readonly errorMessage?: string }
  | { readonly kind: "logged-in"; readonly authId?: string; readonly email?: string };

export function sandAccessStateFromWire(state: number): SandAccessState {
  switch (state) {
    case 1: return "granted";
    case 2: return "unavailable";
    case 3: return "paymentRequired";
    default: return "unknown";
  }
}

export function sandAccessBlockReasonFromWire(reason: number): SandAccessBlockReason {
  switch (reason) {
    case 1: return "none";
    case 2: return "teamPrivacyMode";
    case 3: return "teamSetupRequired";
    case 4: return "teamAccessRequired";
    case 5: return "notOffered";
    case 6: return "freeTrialAvailable";
    case 7: return "paywallIndividual";
    case 8: return "paywallTeamMember";
    case 9: return "paywallTeamAdmin";
    default: return "unspecified";
  }
}

export interface SandAccessBackend {
  getSandAccessStatus(
    request: Readonly<Record<string, never>>,
    options: { readonly timeoutMs: number },
  ): Promise<{ readonly state: number; readonly blockReason: number }>;
}

export async function fetchSandAccess(
  _getAccessToken: (options?: { readonly backendUrl?: string }) => Promise<string>,
  _options: {
    readonly createClient: (credentials: {
      readonly getAccessToken: typeof _getAccessToken;
      readonly getMachineId: () => Promise<string>;
    }) => SandAccessBackend;
    readonly getMachineId: () => Promise<string>;
  },
): Promise<SandAccess> {
  // Official Cursor/Grok authorization removed: access gate is permanently open.
  return { state: "granted", reason: "none" };
}

function accountSlot(status: CursorAuthStatus): string | null {
  if (status.kind !== "logged-in") return null;
  const slot = status.authId ?? status.email;
  return slot == null || slot.length === 0 ? null : slot;
}

export async function readSandAccessOnce(_deps: {
  readonly getAuthStatus: () => Promise<CursorAuthStatus>;
  readonly readAccess: () => Promise<SandAccess>;
}): Promise<{ readonly identity: string | null; readonly access: SandAccess }> {
  // Official auth removed: single local identity with granted access, no paywall check.
  return { identity: "local", access: { state: "granted", reason: "none" } };
}

export function createSandAccessReader(deps: Parameters<typeof readSandAccessOnce>[0]) {
  let generation = 0;
  let answer: { readonly identity: string | null; readonly access: SandAccess } | undefined;
  const answerFor = (identity: string | null): SandAccess =>
    answer !== undefined && answer.identity === identity ? answer.access : SAND_ACCESS_CHECKING;
  const settle = (attempt: number, identity: string | null, access: SandAccess): SandAccess => {
    if (attempt !== generation) return answerFor(identity);
    answer = { identity, access };
    return access;
  };
  return {
    async read(): Promise<SandAccess> {
      const attempt = ++generation;
      const result = await readSandAccessOnce(deps);
      return settle(attempt, result.identity, result.access);
    },
  };
}

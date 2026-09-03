import { accountCacheScope } from "../../shared/node/cursor-token.js";

export function createDesktopAccountAuthorizer(_deps: {
  readonly binding?: { authorize(args: { accountSlot: string; descriptorUrl: string; allowExistingDataClaim: boolean; hasExistingDurableData: () => boolean | Promise<boolean> }): Promise<boolean> };
  readonly descriptorUrl?: string;
  readonly hasExistingDurableData: () => boolean | Promise<boolean>;
  readonly store: { getMcpCustomInstructionsAccountScope(): string | null | undefined; scopeToAccount(scope: string): void };
  readonly abandonForeignOnboardingMirror: () => void;
}) {
  // Official Cursor/Grok authorization removed: single local identity, always authorized.
  // Account scoping is a no-op so settings stay global.
  return async (_slot: string, _context: { readonly isStartup: boolean; readonly previousSlot?: string | null }): Promise<boolean> => true;
}

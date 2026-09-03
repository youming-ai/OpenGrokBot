import { join } from "node:path";

import { SandSettingsStore } from "../../../shared/node/settings/sand-settings-store.js";
import { createProviderPromptSession } from "./provider-session.js";
import { PrivacyMode } from "../../../packages/redaction/privacy-mode.js";
import { getSandRootDir } from "../../host-paths.js";
import type { LabelMessage, PromptExecutor } from "./sand-labeling.js";
import type { SandInferenceProvider } from "../../../shared/inference-router.js";
import type { SummarizationPromptSession } from "../../../packages/agent-summarization/summarization-handler.js";
import type { SandAgentModelSelection } from "../../../shared/agents/sand-agent-model.js";
import type { SandModelExperimentState } from "../../../shared/node/experiments/sand-model-experiment.js";
export interface HostInferenceOptions {
  auth: { getAccessToken(...args: unknown[]): Promise<string>; getMachineId(): string };
  experiments: { checkFeatureGate(name: string): boolean; getComputerUseModelOverride(): SandAgentModelSelection | undefined; getBrowserUseModelOverride(): SandAgentModelSelection | undefined; getSandModelExperimentState(): SandModelExperimentState | null | undefined; hasHydratedStatsigUserId(): boolean; getConfiguredDefaultModel(): SandAgentModelSelection | undefined; getConfiguredAutomationsModel(): SandAgentModelSelection | undefined };
  settings: { getAgentDefaultModel(): SandAgentModelSelection | undefined; getComputerUseModel(): SandAgentModelSelection | undefined; getInferenceProvider(): SandInferenceProvider; recordInferenceUsage(provider: SandInferenceProvider, usage: { inputTokens?: number; outputTokens?: number; cacheReadTokens?: number; cacheWriteTokens?: number }): void };
  onModelExperimentApplied(): void;
}

export function createHostInference(options: HostInferenceOptions) {
  const routerSettings = new SandSettingsStore(join(getSandRootDir(), "settings.json"));
  const wrapExecutor = (executor: PromptExecutor, provider: SandInferenceProvider): PromptExecutor => ({
    appendMessages(messages) { executor.appendMessages(messages); return this; },
    getState: () => executor.getState(),
    getMessages: () => executor.getMessages(),
    clearMessages: () => executor.clearMessages(),
    stream(...args: readonly unknown[]) {
      const result = executor.stream(...args) as Record<string, any>;
      const extendedUsage = result?.extendedUsage as PromiseLike<Record<string, unknown>> | undefined;
      if (extendedUsage != null && typeof extendedUsage.then === "function") {
        void Promise.resolve(extendedUsage).then((usage: Record<string, unknown>) => {
          options.settings.recordInferenceUsage(provider, {
            ...(typeof usage.inputTokens === "number" ? { inputTokens: usage.inputTokens } : {}),
            ...(typeof usage.outputTokens === "number" ? { outputTokens: usage.outputTokens } : {}),
            ...(typeof usage.cacheReadTokens === "number" ? { cacheReadTokens: usage.cacheReadTokens } : {}),
            ...(typeof usage.cacheWriteTokens === "number" ? { cacheWriteTokens: usage.cacheWriteTokens } : {}),
          });
        }).catch(() => {});
      }
      return result;
    },
  });
  // Ollama-only: every legacy stored provider resolves to the local model.
  const createSessionFor = (provider: SandInferenceProvider, state?: unknown) => {
    const session = createProviderPromptSession(provider);
    return {
      getModelId: () => session.getModelId(),
      getExecutor: (executorState: unknown = state) => wrapExecutor(session.getExecutor(executorState) as unknown as PromptExecutor, provider),
    };
  };
  return {
    // Local inference stores nothing remotely and trains on nothing.
    resolvePrivacyMode(): unknown { return PrivacyMode.NO_TRAINING; },
    getGeminiVideoAttachedMediaUrlProvider(): unknown | undefined { return undefined; },
    createSession(_onRequestId: (requestId: string) => void, _sessionOptions?: Readonly<Record<string, unknown>>) {
      return createSessionFor(routerSettings.getInferenceProvider());
    },
    createSummarizationSession(_onRequestId: (requestId: string) => void, _sessionOptions?: Readonly<Record<string, unknown>>) {
      return createSessionFor(routerSettings.getInferenceProvider()) as unknown as SummarizationPromptSession;
    },
    recordPostTurnLabeling(_args: { conversationId: string; requestId: string; modelName: string; messages: readonly LabelMessage[] }): void {},
  };
}

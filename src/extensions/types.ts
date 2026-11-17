export type ExtensionKind = "connectors" | "presets" | "skills";
export type ExtensionStatus = "ready" | "preview";
export type Decision = "ALLOW" | "BLOCK" | "ESCALATE";

export interface PresetRule {
  action: string;
  decision: Decision;
}

export interface ExtensionItem {
  id: string;
  kind: ExtensionKind;
  name: string;
  description: string;
  category: string;
  status: ExtensionStatus;
  rules?: PresetRule[];
  setup?: string;
}
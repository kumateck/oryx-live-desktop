import type { ModuleManifest } from "./contract";
import { validateModuleRegistry } from "./registry-model";

const manifests = import.meta.glob<ModuleManifest>("./*/manifest.ts", { eager: true, import: "manifest" });
export const modules = validateModuleRegistry(Object.values(manifests));

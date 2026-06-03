import type { Project, ApiKey, ApiKeyWithPlain, CreateProjectInput, UpdateProjectInput, GenerateApiKeyInput, UsageStats } from "@/types";
export declare function createProject(input: CreateProjectInput): Promise<Project>;
export declare function listProjects(ownerId: string): Promise<Project[]>;
export declare function getProject(id: string, ownerId: string): Promise<Project>;
export declare function updateProject(id: string, ownerId: string, input: UpdateProjectInput): Promise<Project>;
export declare function deleteProject(id: string, ownerId: string): Promise<void>;
export declare function generateApiKey(projectId: string, ownerId: string, input: GenerateApiKeyInput): Promise<ApiKeyWithPlain>;
export declare function listApiKeys(projectId: string, ownerId: string): Promise<ApiKey[]>;
export declare function revokeApiKey(keyId: string): Promise<void>;
export declare function getUsageStats(_projectId: string): Promise<UsageStats>;
//# sourceMappingURL=api.d.ts.map
/**
 * Central type barrel.
 * Import any shared type from here: `import type { NotionBlogPost } from "@/types"`.
 *
 * Rule: only re-export types that are used in more than one module.
 * Component-private props interfaces live in their own component files.
 * Zod-inferred types (PortfolioConfig, etc.) stay with their schema files.
 */

export type { ContactSubmission, ContactFormState, ToastSeverity, ToastContextType } from "./contact";
export type { NotionBlogPost } from "./blog";
export type { GitHubFileResponse, CommitResult } from "./github";
export type { BreadcrumbItem } from "./ui";

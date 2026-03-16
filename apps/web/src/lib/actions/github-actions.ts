
"use server";

import { github } from "../services/github";
import { revalidatePath } from "next/cache";

export async function updatePortfolioConfig(data: any, message: string) {
  try {
    const path = "config.json";
    
    // Get current file to get SHA
    const file = await github.getFile(path);
    
    // Update file
    const result = await github.updateFile(path, JSON.stringify(data, null, 2), message, file.sha);
    
    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/blogs");
    
    return { success: true, result };
  } catch (error: any) {
    console.error("Failed to update portfolio config:", error);
    return { success: false, error: error.message };
  }
}

export async function createConfigDraft(data: any, message: string) {
  try {
    const branchName = `config-update-${Date.now()}`;
    await github.createBranch(branchName);
    
    const path = "config.json";
    const file = await github.getFile(path);
    
    await github.updateFile(path, JSON.stringify(data, null, 2), message, file.sha, branchName);
    
    const pr = await github.createPullRequest(
      "Update Portfolio Configuration",
      branchName,
      "main",
      message
    );
    
    return { success: true, prUrl: pr.html_url };
  } catch (error: any) {
    console.error("Failed to create config draft:", error);
    return { success: false, error: error.message };
  }
}

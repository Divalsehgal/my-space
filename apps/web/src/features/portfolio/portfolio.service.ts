import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { PortfolioConfigSchema, type PortfolioConfig } from "./schema";
import localConfig from "../../lib/config/portfolio.json";

const CONFIG_URL = "https://raw.githubusercontent.com/Divalsehgal/portfolio-config/main/config.json";

export class PortfolioService {
    private static instance: PortfolioService;
    private cachedConfig: PortfolioConfig | null = null;

    private constructor() {}

    public static getInstance(): PortfolioService {
        if (!PortfolioService.instance) {
            PortfolioService.instance = new PortfolioService();
        }
        return PortfolioService.instance;
    }

    public async getConfig(): Promise<{ config: PortfolioConfig }> {
        if (this.cachedConfig) {
            return { config: this.cachedConfig };
        }

        // 1. Try GitHub first for dynamic updates
        try {
            const res = await fetchWithRetry(() =>
                fetch(CONFIG_URL, {
                    next: { revalidate: 60 }, // Cache for 60 seconds for faster updates
                })
            );

            if (res.ok) {
                const json = await res.json();
                const validatedConfig = PortfolioConfigSchema.parse(json);
                this.cachedConfig = validatedConfig;
                return { config: validatedConfig };
            }
        } catch (error) {
            console.warn("GitHub portfolio fetch failed, falling back to local config:", error);
        }

        // 2. Fallback to local config
        try {
            const validatedConfig = PortfolioConfigSchema.parse(localConfig);
            this.cachedConfig = validatedConfig;
            return { config: validatedConfig };
        } catch (localError) {
            console.error("Local portfolio config validation failed:", localError);
            return { config: localConfig as PortfolioConfig };
        }
    }
}

export const portfolioService = PortfolioService.getInstance();

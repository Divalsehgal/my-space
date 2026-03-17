import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { PortfolioConfigSchema, type PortfolioConfig } from "./schema";
import { FALLBACK_CONFIG } from "./constants";

const CONFIG_URL =
    "https://raw.githubusercontent.com/Divalsehgal/portfolio-config/main/config.json";


export class PortfolioService {
    private static instance: PortfolioService;

    public static getInstance(): PortfolioService {
        if (!PortfolioService.instance) {
            PortfolioService.instance = new PortfolioService();
        }
        return PortfolioService.instance;
    }

    public async getConfig(): Promise<{ config: PortfolioConfig }> {
        let config: PortfolioConfig = FALLBACK_CONFIG;

        // 1. Try GitHub first
        try {
            const res = await fetchWithRetry(() =>
                fetch(CONFIG_URL, {
                    next: { revalidate: 60 },
                })
            );

            if (res.ok) {
                const json = await res.json();
                config = PortfolioConfigSchema.parse(json);
            }
        } catch (error) {
            console.warn(
                "GitHub portfolio fetch failed, falling back to local config:",
                error
            );
        }

        return { config};
    }
}

export const portfolioService = PortfolioService.getInstance();

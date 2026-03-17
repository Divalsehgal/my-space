import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { PortfolioConfigSchema, type PortfolioConfig } from "./schema";

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
        try {
            const res = await fetchWithRetry(() =>
                fetch(CONFIG_URL, {
                    next: { 
                        revalidate: 60,
                        tags: ["portfolio"] 
                    },
                })
            );

            if (!res.ok) {
                throw new Error(`Failed to fetch portfolio config: ${res.statusText}`);
            }

            const json = await res.json();
            const config = PortfolioConfigSchema.parse(json);
            return { config };
        } catch (error) {
            console.error("Critical: GitHub portfolio fetch failed:", error);
            throw error;
        }
    }
}

export const portfolioService = PortfolioService.getInstance();

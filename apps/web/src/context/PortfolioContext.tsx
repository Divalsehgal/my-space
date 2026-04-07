"use client";

import { type PortfolioConfig } from "@/features/portfolio";
import React, { createContext, useContext } from "react";

export const PortfolioContext = createContext<PortfolioConfig | null>(null);

export const usePortfolioContext = () => {
    return useContext(PortfolioContext);
};

export const PortfolioProvider: React.FC<{ children: React.ReactNode; value: PortfolioConfig }> = ({ children, value }) => {
    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
};
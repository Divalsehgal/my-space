import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { nextEslintConfig } from "@dival-sehgal/eslint-config";

// Same rules as apps/web, so code moved into packages keeps its guarantees.
export default [...nextVitals, ...nextTs, ...nextEslintConfig];

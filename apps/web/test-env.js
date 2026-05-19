/* eslint-disable no-console, @typescript-eslint/no-require-imports */
console.log("CWD:", process.cwd(), "SPACE:", process.env.CONTENTFUL_SPACE_ID, "ENV_EXISTS:", require("fs").existsSync(".env"));


import { generateCsrfHandler } from "../../../../middleware/csrf.ts";

export const handler = [generateCsrfHandler];

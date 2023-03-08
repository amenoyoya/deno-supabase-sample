import { verifyCsrfHandler } from "../../../../middleware/csrf.ts";

export const handler = [verifyCsrfHandler];

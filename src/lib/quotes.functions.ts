import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getQuotes = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ symbols: z.array(z.string()).max(20) }).parse(data))
  .handler(async ({ data }) => {
    const { fetchQuotes } = await import("./quotes.server");
    return fetchQuotes(data.symbols);
  });

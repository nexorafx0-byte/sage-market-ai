import { createServerFn } from "@tanstack/react-start";

import { fetchCalendar, fetchNews } from "./news.server";

export const getNewsFeed = createServerFn({ method: "GET" }).handler(async () => {
  const [calendar, news] = await Promise.all([fetchCalendar(), fetchNews()]);
  return { calendar, news, updatedAt: new Date().toISOString() };
});

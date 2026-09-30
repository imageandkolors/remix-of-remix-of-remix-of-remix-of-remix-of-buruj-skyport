import { queryOptions } from "@tanstack/react-query";
import { getNews, getProgrammes } from "./public.functions";

export const programmesQuery = queryOptions({ queryKey: ["programmes"], queryFn: () => getProgrammes() });
export const newsQuery = queryOptions({ queryKey: ["news"], queryFn: () => getNews() });

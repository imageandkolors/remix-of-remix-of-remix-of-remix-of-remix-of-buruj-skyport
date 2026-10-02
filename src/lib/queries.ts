import { queryOptions } from "@tanstack/react-query";
import { getNews, getPlayer, getPlayers, getProgrammes } from "./public.functions";

export const programmesQuery = queryOptions({ queryKey: ["programmes"], queryFn: () => getProgrammes() });
export const newsQuery = queryOptions({ queryKey: ["news"], queryFn: () => getNews() });
export const playersQuery = queryOptions({ queryKey: ["players"], queryFn: () => getPlayers() });
export const playerQuery = (slug: string) => queryOptions({ queryKey: ["player", slug], queryFn: () => getPlayer({ data: { slug } }) });

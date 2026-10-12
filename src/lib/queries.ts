import { queryOptions } from "@tanstack/react-query";
import { getPlayer, getPlayers, getProgramme, getProgrammes } from "./public.functions";
import { getNews, getNewsArticle } from "./content.functions";

export const programmesQuery = queryOptions({ queryKey: ["programmes"], queryFn: () => getProgrammes() });
export const programmeQuery = (slug: string) => queryOptions({ queryKey: ["programme", slug], queryFn: () => getProgramme({ data: { slug } }) });
export const newsQuery = queryOptions({ queryKey: ["news"], queryFn: () => getNews() });
export const playersQuery = queryOptions({ queryKey: ["players"], queryFn: () => getPlayers() });
export const playerQuery = (slug: string) => queryOptions({ queryKey: ["player", slug], queryFn: () => getPlayer({ data: { slug } }) });
export const newsArticleQuery = (slug: string) => queryOptions({ queryKey: ["news", slug], queryFn: () => getNewsArticle({ data: { slug } }) });

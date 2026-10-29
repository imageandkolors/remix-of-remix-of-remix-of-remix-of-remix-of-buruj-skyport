import { queryOptions } from "@tanstack/react-query";
import { getPlayer, getPlayers, getProgramme, getProgrammes } from "./public.functions";
import { getGalleryMedia, getNews, getNewsArticle, getSplashSlides } from "./content.functions";

export const programmesQuery = queryOptions({
  queryKey: ["programmes"],
  queryFn: () => getProgrammes().catch(() => []),
});
export const programmeQuery = (slug: string) =>
  queryOptions({ queryKey: ["programme", slug], queryFn: () => getProgramme({ data: { slug } }) });
export const newsQuery = queryOptions({
  queryKey: ["news"],
  queryFn: () => getNews().catch(() => []),
});
export const playersQuery = queryOptions({
  queryKey: ["players"],
  queryFn: () => getPlayers().catch(() => []),
});
export const playerQuery = (slug: string) =>
  queryOptions({ queryKey: ["player", slug], queryFn: () => getPlayer({ data: { slug } }) });
export const newsArticleQuery = (slug: string) =>
  queryOptions({ queryKey: ["news", slug], queryFn: () => getNewsArticle({ data: { slug } }) });
export const splashSlidesQuery = queryOptions({
  queryKey: ["splash-slides"],
  queryFn: () => getSplashSlides().catch(() => []),
});
export const galleryMediaQuery = queryOptions({
  queryKey: ["gallery-media"],
  queryFn: () => getGalleryMedia().catch(() => []),
});

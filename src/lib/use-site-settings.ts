import { useQuery } from "@tanstack/react-query";
import { DEFAULT_SETTINGS, getSiteSettings } from "./settings.functions";

export function useSiteSettings() {
  const q = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings(), staleTime: 60_000 });
  return q.data ?? DEFAULT_SETTINGS;
}

export const waLinkFor = (number: string, text = "Hello Buruj Sports Academy, I'd like to enquire about your programmes.") =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

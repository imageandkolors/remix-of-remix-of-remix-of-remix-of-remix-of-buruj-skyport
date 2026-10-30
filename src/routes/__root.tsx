import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { TrialSheetProvider } from "@/components/site/TrialForm";
import { MobileTabBar } from "@/components/app/MobileTabBar";
import { InstallPrompt } from "@/components/app/InstallPrompt";
import { CookieConsent } from "@/components/app/CookieConsent";
import { getPageSeo } from "@/lib/page-settings.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FFFFFF" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "WELCOME TO BURUJ SPORTS ACADEMY" },
      { title: "Buruj Sports Academy" },
      {
        name: "description",
        content: "Elite football development and residential Play & Study in Ikorodu, Lagos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TrialSheetProvider>
        <Header />
        <ManagedSeo />
        <main>
          <Outlet />
        </main>
        <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <Footer />
        </div>
        <MobileTabBar />
      </TrialSheetProvider>
      <Toaster richColors />
      <InstallPrompt />
      <CookieConsent />
      <LaunchScreen />
    </QueryClientProvider>
  );
}

function LaunchScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6 text-center text-navy"
      role="status"
      aria-label="Welcome to Buruj Sports Academy"
    >
      <img
        src="/icon-512.png"
        alt="Buruj Sports Academy crest"
        className="h-40 w-40 object-contain sm:h-48 sm:w-48"
      />
      <h1 className="mt-8 max-w-sm font-display text-3xl font-extrabold uppercase leading-tight tracking-wide sm:text-4xl">
        Welcome to Buruj Sports Academy
      </h1>
    </div>
  );
}

function ManagedSeo() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const pageKey =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/about")
        ? "about"
        : pathname.startsWith("/contact")
          ? "contact"
          : pathname.startsWith("/programmes")
            ? "programmes"
            : pathname.startsWith("/players")
              ? "players"
              : pathname.startsWith("/news")
                ? "news"
                : pathname.startsWith("/gallery")
                  ? "gallery"
                  : pathname.startsWith("/admissions")
                    ? "admissions"
                    : pathname.startsWith("/portal")
                      ? "portal"
                      : pathname.startsWith("/privacy-policy")
                        ? "privacy"
                        : null;
  const { data } = useQuery({
    queryKey: ["page-seo-runtime", pageKey],
    queryFn: () => getPageSeo({ data: { page_key: pageKey! } }),
    enabled: Boolean(pageKey),
    staleTime: 60_000,
  });
  useEffect(() => {
    if (!data) return;
    document.title = data.title;
    const update = (selector: string, attribute: string, value: string | null) => {
      if (!value) return;
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, selector.match(/['"]([^'"]+)['"]/)?.[1] || "");
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };
    update('meta[name="description"]', "name", data.description);
    update('meta[name="keywords"]', "name", data.keywords);
    update('meta[name="robots"]', "name", data.robots);
    update('meta[property="og:title"]', "property", data.og_title || data.title);
    update('meta[property="og:description"]', "property", data.og_description || data.description);
    update('meta[property="og:type"]', "property", data.og_type);
    update('meta[property="og:image"]', "property", data.og_image_url);
    update('meta[name="twitter:card"]', "name", data.twitter_card);
    update('meta[name="twitter:title"]', "name", data.og_title || data.title);
    update('meta[name="twitter:description"]', "name", data.og_description || data.description);
    update('meta[name="twitter:image"]', "name", data.og_image_url);
    if (data.canonical_url) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = data.canonical_url;
    }
  }, [data]);
  return null;
}

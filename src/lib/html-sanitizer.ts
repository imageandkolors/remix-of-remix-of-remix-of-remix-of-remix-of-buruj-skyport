import sanitizeHtml from "sanitize-html";

const allowedTags = [...sanitizeHtml.defaults.allowedTags, "img", "video", "source", "iframe"];

/** Sanitize staff-authored rich text before it is persisted and rendered publicly. */
export function cleanHtml(html: string): string {
  return sanitizeHtml(html.slice(0, 100_000), {
    allowedTags,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
      video: ["src", "controls", "width", "height", "poster", "preload"],
      source: ["src", "type"],
      iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "loading"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

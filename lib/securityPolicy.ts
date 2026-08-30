export const UP_API_ORIGIN = "https://api.up.com.au";

/** Prevent an upstream pagination link from turning the server route into an SSRF proxy. */
export function isAllowedUpApiUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.origin === UP_API_ORIGIN &&
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname.startsWith("/api/v1/")
    );
  } catch {
    return false;
  }
}

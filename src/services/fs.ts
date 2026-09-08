export async function GetCurrentFSUrl(): Promise<string> {
  try {
    const pageUrl = "https://fstream.net/";
    const html = await fetch(pageUrl, { method: "GET" }).then((response) =>
      response.text(),
    );

    const match =
      html.match(/class="[^"]*url-display[^"]*"[^>]*href="([^"]+)"/i) ||
      html.match(/href="([^"]+)"[^>]*class="[^"]*url-display[^"]*"/i);

    if (match && match[1]) {
      return match[1].replace(/\/$/, "");
    }
  } catch (error) {}
  return "https://fs23.lol";
}

export type DownloadStatus =
  | "initialization"
  | "downloading"
  | "completed"
  | "error";

export async function ResolveDirectDownloadUrl(
  vidzyPageUrl: string,
  onStatusChange?: (status: DownloadStatus, message?: string) => void,
): Promise<string | undefined> {
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    onStatusChange?.("initialization", "Initialisation...");

    let pageUrl = vidzyPageUrl;
    if (!pageUrl.endsWith("_n")) {
      const step1Res = await fetch(pageUrl, { headers }).then((res) =>
        res.text(),
      );
      const subpageMatch = step1Res.match(/href="([^"]*\/d\/[a-zA-Z0-9]+_n)"/i);
      if (subpageMatch && subpageMatch[1]) {
        pageUrl = subpageMatch[1].startsWith("http")
          ? subpageMatch[1]
          : `https://vidzy.cc${subpageMatch[1]}`;
      }
    }

    const step2Html = await fetch(pageUrl, { headers }).then((res) =>
      res.text(),
    );

    const opMatch = step2Html.match(/name="op"\s+value="([^"]+)"/i);
    const idMatch = step2Html.match(/name="id"\s+value="([^"]+)"/i);
    const modeMatch = step2Html.match(/name="mode"\s+value="([^"]+)"/i);
    const hashMatch = step2Html.match(/name="hash"\s+value="([^"]+)"/i);

    if (opMatch && idMatch && hashMatch) {
      const params = new URLSearchParams();
      params.append("op", opMatch[1]);
      params.append("id", idMatch[1]);
      params.append("mode", modeMatch?.[1] || "n");
      params.append("hash", hashMatch[1]);

      onStatusChange?.("initialization", "Initialisation...");

      const postHtml = await fetch(pageUrl, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }).then((res) => res.text());

      const directMatch =
        postHtml.match(/class="[^"]*main-button[^"]*"[^>]*href="([^"]+)"/i) ||
        postHtml.match(/href="([^"]+)"[^>]*class="[^"]*main-button[^"]*"/i) ||
        postHtml.match(/href="([^"]+\/v\/[^\s"'<>]+)"/i);

      if (directMatch && directMatch[1]) {
        return directMatch[1];
      }
    }
  } catch (error) {}
  return vidzyPageUrl;
}

export async function GetVidzyLink(
  movieTitle: string,
  onStatusChange?: (status: DownloadStatus, message?: string) => void,
): Promise<string | undefined> {
  try {
    onStatusChange?.("initialization", "Initialisation...");

    const baseUrl = await GetCurrentFSUrl();

    const searchApiUrl = `${baseUrl}/engine/ajax/search.php`;

    const searchHtml = await fetch(searchApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: `query=${encodeURIComponent(movieTitle)}&page=1`,
    }).then((res) => res.text());

    const newsIdMatches = [
      ...searchHtml.matchAll(/location\.href=['"][^'"]*?\/(\d+)-[^'"]*['"]/gi),
    ].map((m) => m[1]);

    if (!newsIdMatches.length) {
      return undefined;
    }

    onStatusChange?.("initialization", "Initialisation...");

    for (const newsId of newsIdMatches.slice(0, 3)) {
      const filmApiUrl = `${baseUrl}/engine/ajax/film_api.php?id=${newsId}`;

      const res = await fetch(filmApiUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const vidzyPlayers = data?.players?.vidzy;

      if (vidzyPlayers) {
        const embedUrl =
          vidzyPlayers.default ||
          vidzyPlayers.vostfr ||
          vidzyPlayers.vfq ||
          vidzyPlayers.vff;

        if (embedUrl) {
          const vidzyPageUrl = embedUrl.replace(
            /\/embed-([a-zA-Z0-9_-]+)\.html/i,
            "/d/$1.html",
          );

          const directFileUrl = await ResolveDirectDownloadUrl(
            vidzyPageUrl,
            onStatusChange,
          );

          return directFileUrl || vidzyPageUrl;
        }
      }
    }
  } catch (error) {}

  return undefined;
}

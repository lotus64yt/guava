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
  return "https://fs27.lol";
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

export async function ResolveVidzyEmbedStreamUrl(
  embedUrl: string,
  onStatusChange?: (status: DownloadStatus, message?: string) => void,
): Promise<string | undefined> {
  try {
    onStatusChange?.("initialization", "Initialisation...");

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    const html = await fetch(embedUrl, { headers }).then((res) => res.text());

    // 1. Check for video/source tag src attribute with direct mp4 (ignore blob: and .m3u8)
    const videoSrcMatch =
      html.match(/<video[^>]+src=["']([^"']+\.mp4[^"']*)["']/i) ||
      html.match(/<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/i);

    if (
      videoSrcMatch &&
      videoSrcMatch[1] &&
      !videoSrcMatch[1].startsWith("blob:")
    ) {
      return videoSrcMatch[1];
    }

    // 2. Check for JS player direct mp4 source definitions
    const jsSourceMatch =
      html.match(/file\s*:\s*["']([^"']+\.mp4[^"']*)["']/i) ||
      html.match(/src\s*:\s*["']([^"']+\.mp4[^"']*)["']/i) ||
      html.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)["']/i);

    if (jsSourceMatch && jsSourceMatch[1]) {
      return jsSourceMatch[1];
    }
  } catch (error) {}

  return undefined;
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

    const matches = [
      ...searchHtml.matchAll(/href=['"]([^'"]*?\/(\d+)-([^'"]*))['"]/gi),
    ].map((m) => ({
      url: m[1],
      id: m[2],
      slug: m[3].replace(/\.html$/i, ""),
    }));

    if (!matches.length) {
      return undefined;
    }

    const normTarget = movieTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, " ")
      .trim();
    const targetWords = normTarget.split(/\s+/).filter((w) => w.length > 0);

    const scored = matches.map((item) => {
      const normSlug = item.slug
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, " ")
        .trim();
      const slugWords = normSlug.split(/\s+/).filter((w) => w.length > 0);

      let score = 0;
      for (const tw of targetWords) {
        if (slugWords.includes(tw)) score += 10;
      }

      if (
        normSlug.includes("bande annonce") ||
        normSlug.includes("teaser") ||
        normSlug.includes("trailer")
      ) {
        score -= 50;
      }
      if (normSlug.includes("saison") && !normTarget.includes("saison")) {
        score -= 30;
      }

      const extraWords = slugWords.filter(
        (w) =>
          !targetWords.includes(w) &&
          !["film", "streaming", "complet", "vf", "vostfr", "french"].includes(
            w,
          ),
      );
      score -= extraWords.length * 5;

      const cleanedSlug = normSlug
        .replace(/\b(film|streaming|complet|vf|vostfr|french)\b/g, "")
        .trim();
      if (cleanedSlug === normTarget) {
        score += 50;
      }

      return { ...item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    onStatusChange?.("initialization", "Initialisation...");

    for (const item of scored.slice(0, 4)) {
      const filmApiUrl = `${baseUrl}/engine/ajax/film_api.php?id=${item.id}`;

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
          const streamUrl = await ResolveVidzyEmbedStreamUrl(
            embedUrl,
            onStatusChange,
          );
          if (streamUrl) {
            return streamUrl;
          }

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

import { NextResponse } from "next/server"
import { allScreenings } from "@/lib/screenings"

/**
 * Streams a film poster back from our own origin.
 *
 * The poster generator draws film artwork onto a canvas and then exports it.
 * Several of the hosts we link to send no CORS headers, which taints the canvas
 * and makes the export fail outright — so the images are fetched server-side
 * and served from here instead.
 *
 * Only URLs that already appear in the screening data are fetched, which rules
 * out this route being used to probe arbitrary hosts.
 */
const ALLOWED = new Set(allScreenings.map((s) => s.posterUrl))

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")

  if (!target || !ALLOWED.has(target)) {
    return NextResponse.json({ error: "unknown poster" }, { status: 400 })
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        // Some poster hosts refuse requests without a browser-ish UA.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 }
      )
    }

    const type = upstream.headers.get("content-type") ?? ""
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 502 })
    }

    return new NextResponse(await upstream.arrayBuffer(), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 504 })
  }
}

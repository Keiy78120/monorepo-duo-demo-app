import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().min(3),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      q: searchParams.get("q") || "",
      postalCode: searchParams.get("postalCode") || undefined,
      city: searchParams.get("city") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, postalCode, city, limit } = parsed.data;
    const url = new URL("https://data.geopf.fr/geocodage/search");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", limit || "5");
    if (postalCode) url.searchParams.set("postcode", postalCode);
    if (city) url.searchParams.set("city", city);

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "mini-app-address-autocomplete" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Address autocomplete service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    const suggestions = features
      .map((feature: any) => {
        const props = feature?.properties || {};
        return {
          label: props.label as string,
          street: (props.name as string) || "",
          postalCode: (props.postcode as string) || "",
          city: (props.city as string) || "",
        };
      })
      .filter((item: { label?: string }) => Boolean(item.label));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Address autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to fetch address suggestions" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  street: z.string().min(1),
  postalCode: z.string().min(2).max(10),
  city: z.string().min(1),
});

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid address input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { street, postalCode, city } = parsed.data;
    const query = `${street}, ${postalCode} ${city}`.trim();

    const url = new URL("https://data.geopf.fr/geocodage/search");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
    url.searchParams.set("postcode", postalCode);
    url.searchParams.set("city", city);

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "mini-app-address-validator" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Address validation service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    if (features.length === 0) {
      return NextResponse.json({ valid: false, score: 0, suggestions: [] });
    }

    const best = features[0];
    const props = best.properties || {};
    const score = typeof props.score === "number" ? props.score : 0;
    const bestPostcode = String(props.postcode || "");
    const bestCity = String(props.city || "");

    const scoreOk = score >= 0.7;
    const postcodeOk = bestPostcode ? bestPostcode === postalCode : true;
    const cityOk = bestCity
      ? normalize(bestCity).includes(normalize(city)) ||
        normalize(city).includes(normalize(bestCity))
      : true;

    const suggestion = props.label
      ? {
          label: props.label as string,
          street: (props.name as string) || street,
          postalCode: bestPostcode || postalCode,
          city: bestCity || city,
        }
      : null;

    const suggestions = features
      .slice(0, 3)
      .map((feature: any) => feature?.properties?.label)
      .filter((label: string | undefined) => typeof label === "string");

    return NextResponse.json({
      valid: scoreOk && postcodeOk && cityOk,
      score,
      label: props.label || null,
      postcode: bestPostcode || null,
      city: bestCity || null,
      context: props.context || null,
      type: props.type || null,
      suggestion,
      suggestions,
    });
  } catch (error) {
    console.error("Address validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate address" },
      { status: 500 }
    );
  }
}

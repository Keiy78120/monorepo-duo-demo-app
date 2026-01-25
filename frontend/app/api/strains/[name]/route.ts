import { NextRequest, NextResponse } from "next/server";
import { getStrainsByName, CannabisStrain } from "@/lib/integrations/cannabis";

// GET /api/strains/[name] - Proxy to Cannabis API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Strain name is required" },
        { status: 400 }
      );
    }

    const cannabisApiUrl = process.env.CANNABIS_API_URL;

    if (!cannabisApiUrl) {
      // Return empty result if API not configured (graceful degradation)
      return NextResponse.json(
        { message: "Cannabis API not configured" },
        { status: 200 }
      );
    }

    const strains = await getStrainsByName(cannabisApiUrl, name);

    if (!strains || strains.length === 0) {
      return NextResponse.json(
        { message: "Strain not found" },
        { status: 200 }
      );
    }

    // Find best match (exact name match or first result)
    const normalizedName = name.toLowerCase().trim();
    const exactMatch = strains.find(
      (s) => s.name.toLowerCase().trim() === normalizedName
    );

    const bestMatch = exactMatch || strains[0];

    // Return the best matching strain
    return NextResponse.json({
      name: bestMatch.name,
      type: bestMatch.type,
      effects: bestMatch.effects,
      flavors: bestMatch.flavors,
      description: bestMatch.description,
      rating: bestMatch.rating,
    });
  } catch (error) {
    console.error("Strain API error:", error);

    // Don't expose internal errors to client
    return NextResponse.json(
      { message: "Failed to fetch strain data" },
      { status: 200 } // Return 200 to avoid breaking the UI
    );
  }
}

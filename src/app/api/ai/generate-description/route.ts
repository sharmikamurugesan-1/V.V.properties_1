import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateLuxuryPropertyDescription } from "@/lib/ai-property";

const generateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  location: z.string().min(2, "Location is required"),
  corridor: z.string().optional(),
  propertyType: z.string().min(2, "Property type is required"),
  bedrooms: z.number().int().nonnegative().optional(),
  areaSqft: z.number().positive().optional(),
  priceDisplay: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  keyHighlights: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const generated = generateLuxuryPropertyDescription(parsed.data);

    return NextResponse.json({
      success: true,
      data: generated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

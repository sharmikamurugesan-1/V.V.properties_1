import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchPropertiesWithPreferences } from "@/lib/ai-property";

const matchmakingSchema = z.object({
  minBudget: z.number().nonnegative().optional(),
  maxBudget: z.number().positive().optional(),
  preferredLocation: z.string().optional(),
  propertyType: z.string().optional(),
  minBedrooms: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(20).default(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = matchmakingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search preferences", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const matches = await matchPropertiesWithPreferences(parsed.data);

    return NextResponse.json({
      success: true,
      count: matches.length,
      recommendations: matches,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

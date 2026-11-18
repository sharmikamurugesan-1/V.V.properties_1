import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("properties")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API properties GET Error]", error.message, error.details);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Authoritative cloud response (including empty [] when all properties deleted)
    return NextResponse.json({
      success: true,
      properties: data || [],
      count: (data || []).length,
      source: "supabase",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API properties GET Fatal Error]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const propData = body.property || body;
    if (!propData) {
      return NextResponse.json({ error: "Missing property data" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const propId = propData.id || `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Parse numeric prices supporting decimal floats (e.g. 4.5 Lakhs, 1.25 Cr, 45.75)
    let rawPrice = propData.totalPrice ?? propData.price ?? propData.total_price ?? 0;
    if (typeof rawPrice === 'string') {
      const cleaned = rawPrice.replace(/[₹,\s]/g, '').toLowerCase();
      if (cleaned.includes('cr')) {
        rawPrice = parseFloat(cleaned) * 100; // in Lakhs
      } else if (cleaned.includes('l')) {
        rawPrice = parseFloat(cleaned);
      } else {
        rawPrice = parseFloat(cleaned) || 0;
      }
    }
    const totalPriceFloat = Number(parseFloat(String(rawPrice || 0)).toFixed(2));

    const priceDisplay =
      propData.priceDisplay ||
      (totalPriceFloat >= 100
        ? `₹${(totalPriceFloat / 100).toFixed(2).replace(/\.00$/, '')} Cr`
        : `₹${totalPriceFloat.toFixed(2).replace(/\.00$/, '')} Lakhs`);

    const supabase = createAdminClient();

    const row = {
      id: propId,
      title: propData.title || "Untitled Property",
      slug: propData.slug || `prop-${Date.now()}`,
      project_title: propData.projectTitle || propData.title || "V.V. Properties Development",
      type: propData.type || "Plot",
      location: propData.location || "Coimbatore",
      corridor: propData.corridor || null,
      total_price: totalPriceFloat,
      price_display: priceDisplay,
      area_cents: Number(parseFloat(String(propData.areaCents || propData.area_cents || 0)).toFixed(2)),
      area_sqft: Number(parseFloat(String(propData.areaSqFt || propData.area_sqft || 0)).toFixed(2)),
      bedrooms: propData.bedrooms ? parseInt(String(propData.bedrooms), 10) : null,
      status: propData.status || "Available",
      badge: propData.badge || propData.badgeTag || null,
      cover_image:
        propData.coverImage ||
        propData.featuredImage ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      gallery: Array.isArray(propData.gallery)
        ? propData.gallery
        : Array.isArray(propData.galleryImages)
          ? propData.galleryImages
          : [],
      amenities: propData.amenities || [],
      description: propData.description || null,
      ai_generated_summary: propData.ai_generated_summary || propData.shortDescription || null,
      updated_at: nowIso,
    };

    console.log(`[API properties POST] Upserting property ID: ${row.id}, title: "${row.title}"`);
    const { data, error } = await (supabase.from("properties") as any).upsert(row).select();

    if (error) {
      console.error("[API properties POST Upsert Error]", error.message, error.details);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, property: data?.[0] ?? row });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API properties POST Fatal Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    console.log(`[API properties DELETE] Deleting property ID: ${id}`);
    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      console.error("[API properties DELETE Error]", error.message, error.details);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API properties DELETE Fatal Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

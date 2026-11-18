import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/server";

const DATA_PATH = path.join(process.cwd(), "data", "properties.json");

function getLocalProperties() {
  if (fs.existsSync(DATA_PATH)) {
    try {
      const raw = fs.readFileSync(DATA_PATH, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("[Local Storage Read Error]", e);
    }
  }
  return [];
}

function saveLocalProperties(props: unknown) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(props, null, 2), "utf-8");
  } catch (e) {
    console.error("[Local Storage Write Error]", e);
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Attempt Supabase fetch
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, properties: data, source: "supabase" });
      }
    }
  } catch (supabaseErr) {
    console.warn("[Supabase GET Properties Fallback]", supabaseErr);
  }

  // 2. Resilient fallback to local properties
  const properties = getLocalProperties();
  return NextResponse.json({ success: true, properties, source: "local" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const propData = body.property;
    if (!propData) {
      return NextResponse.json({ error: "Missing property data" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    if (!propData.id) {
      propData.id = `prop_${Date.now()}`;
    }
    propData.updatedAt = nowIso;

    // 1. Persist to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createAdminClient();
        await (supabase.from("properties") as any).upsert({
          id: propData.id,
          title: propData.title,
          slug: propData.slug || propData.id,
          project_title: propData.projectTitle || propData.title,
          type: propData.type || "Plot",
          location: propData.location,
          corridor: propData.corridor || null,
          total_price: Number(propData.totalPrice || propData.price || 0),
          price_display: propData.priceDisplay || `₹${propData.totalPrice || propData.price} Lakhs`,
          area_cents: Number(propData.areaCents || 0),
          area_sqft: Number(propData.areaSqFt || 0),
          status: propData.status || "Available",
          badge: propData.badge || null,
          cover_image: propData.coverImage || propData.featuredImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
          amenities: propData.amenities || [],
          description: propData.description || null,
        });
      } catch (sbErr) {
        console.warn("[Supabase Upsert Warning]", sbErr);
      }
    }

    // 2. Persist locally
    const properties = getLocalProperties();
    const existingIndex = properties.findIndex((p: { id?: string }) => p.id === propData.id);

    if (existingIndex >= 0) {
      properties[existingIndex] = propData;
    } else {
      propData.createdAt = nowIso;
      properties.unshift(propData);
    }

    saveLocalProperties(properties);
    return NextResponse.json({ success: true, property: propData, properties });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
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

    // 1. Delete from Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createAdminClient();
        await supabase.from("properties").delete().eq("id", id);
      } catch (sbErr) {
        console.warn("[Supabase DELETE Warning]", sbErr);
      }
    }

    // 2. Delete from local storage
    let properties = getLocalProperties();
    properties = properties.filter((p: { id?: string }) => p.id !== id);
    saveLocalProperties(properties);

    return NextResponse.json({ success: true, properties });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

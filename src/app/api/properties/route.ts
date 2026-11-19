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

    // Authoritative cloud response (excluding internal system configuration rows)
    const filteredProps = (data || []).filter(
      (p: any) => !String(p.id || "").startsWith("__system_config")
    );

    return NextResponse.json({
      success: true,
      properties: filteredProps,
      count: filteredProps.length,
      source: "supabase",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API properties GET Fatal Error]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function normalizePrice(raw: unknown) {
  if (raw === null || raw === undefined || raw === "") {
    return { priceInr: 0, priceLakhs: 0, displayFormatted: "Price on Request", compactFormatted: "Price on Request" };
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    let rupees = raw;
    let lakhs = raw;
    if (raw < 10000) {
      rupees = raw * 100000;
      lakhs = raw;
    } else {
      rupees = raw;
      lakhs = raw / 100000;
    }
    return formatPriceResult(rupees, lakhs);
  }

  const str = String(raw).trim();
  const lower = str.toLowerCase().replace(/[₹,\s]/g, "");
  if (!lower) {
    return { priceInr: 0, priceLakhs: 0, displayFormatted: "Price on Request", compactFormatted: "Price on Request" };
  }

  const cleanPrimary = lower.split("(")[0].trim();

  const crMatch = cleanPrimary.match(/^([\d.]+)(?:cr|crore|crores)$/);
  if (crMatch) {
    const cr = parseFloat(crMatch[1]);
    if (Number.isFinite(cr) && cr > 0) {
      return formatPriceResult(cr * 10000000, cr * 100);
    }
  }

  const lMatch = cleanPrimary.match(/^([\d.]+)(?:l|lac|lacs|lakh|lakhs)$/);
  if (lMatch) {
    const l = parseFloat(lMatch[1]);
    if (Number.isFinite(l) && l > 0) {
      return formatPriceResult(l * 100000, l);
    }
  }

  const kMatch = cleanPrimary.match(/^([\d.]+)k$/);
  if (kMatch) {
    const k = parseFloat(kMatch[1]);
    if (Number.isFinite(k) && k > 0) {
      return formatPriceResult(k * 1000, k / 100);
    }
  }

  const num = parseFloat(cleanPrimary);
  if (!Number.isFinite(num) || num <= 0) {
    return { priceInr: 0, priceLakhs: 0, displayFormatted: "Price on Request", compactFormatted: "Price on Request" };
  }

  if (num < 25 && cleanPrimary.includes(".")) {
    return formatPriceResult(num * 10000000, num * 100);
  }

  if (num <= 1000) {
    return formatPriceResult(num * 100000, num);
  }

  return formatPriceResult(num, num / 100000);
}

function formatPriceResult(rupees: number, lakhs: number) {
  const hasDecimals = (rupees % 1) !== 0;
  const intPart = Math.floor(rupees);
  const decPart = hasDecimals ? (rupees % 1).toFixed(2).slice(1) : "";
  const inrFormatted = `₹ ${intPart.toLocaleString("en-IN")}${decPart}`;

  let compactFormatted = "";
  if (rupees >= 10000000) {
    const cr = rupees / 10000000;
    compactFormatted = `₹ ${cr.toFixed(2).replace(/\.00$/, "")} Cr`;
  } else if (rupees >= 100000) {
    const l = rupees / 100000;
    compactFormatted = `₹ ${l.toFixed(2).replace(/\.00$/, "")} L`;
  } else {
    compactFormatted = inrFormatted;
  }

  return {
    priceInr: Number(rupees.toFixed(2)),
    priceLakhs: Number(lakhs.toFixed(2)),
    displayFormatted: inrFormatted,
    compactFormatted: compactFormatted,
  };
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
    
    // Parse numeric prices supporting decimal floats (e.g. 4.5 Lakhs, 1.25 Cr, 45.75, 2500000.50)
    const rawPriceInput = propData.priceInr ?? propData.price_display ?? propData.priceDisplay ?? propData.totalPrice ?? propData.price ?? propData.total_price;
    const priceNorm = normalizePrice(rawPriceInput);

    const priceDisplay =
      propData.price_display ||
      propData.priceDisplay ||
      (priceNorm.priceInr > 0
        ? `${priceNorm.displayFormatted} (${priceNorm.compactFormatted})`
        : "Price on Request");

    const supabase = createAdminClient();

    const row = {
      id: propId,
      title: propData.title || "Untitled Property",
      slug: propData.slug || `prop-${Date.now()}`,
      project_title: propData.projectTitle || propData.title || "V.V. Properties Development",
      type: propData.type || "Plot",
      location: propData.location || "Coimbatore",
      corridor: propData.corridor || null,
      total_price: priceNorm.priceLakhs,
      price_display: priceDisplay,
      area_cents: Number(parseFloat(String(propData.areaCents || propData.area_cents || 0)).toFixed(2)),
      area_sqft: Number(parseFloat(String(propData.areaSqFt || propData.area_sqft || 0)).toFixed(2)),
      bedrooms: propData.bedrooms ? parseInt(String(propData.bedrooms), 10) : null,
      status: propData.status || "Available",
      badge: propData.badge || propData.badgeTag || null,
      cover_image:
        propData.cover_image ||
        propData.coverImage ||
        propData.featuredImage ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      gallery: Array.isArray(propData.gallery)
        ? propData.gallery
        : Array.isArray(propData.galleryImages)
          ? propData.galleryImages
          : [],
      amenities: propData.amenities || [],
      description: propData.description || "",
      ai_generated_summary: JSON.stringify({
        priceInr: priceNorm.priceInr,
        priceLakhs: priceNorm.priceLakhs,
        displayFormatted: priceNorm.displayFormatted,
        compactFormatted: priceNorm.compactFormatted,
        ...(typeof propData.ai_generated_summary === "string" ? (() => { try { return JSON.parse(propData.ai_generated_summary); } catch { return {}; } })() : (propData.ai_generated_summary || {}))
      }),
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

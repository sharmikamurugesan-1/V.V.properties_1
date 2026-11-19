import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_HERO_SLIDES = [
  {
    id: "slide-01",
    title: "Find a place to call home.",
    subtitle: "Discover curated luxury residences and investment-grade estates with trust, transparency, and ease.",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600",
    display_order: 1,
    is_active: true,
  },
  {
    id: "slide-02",
    title: "Elevated living crafted for tomorrow.",
    subtitle: "Private full-floor penthouses and sea-facing sanctuaries tailored for discerning domestic and overseas buyers.",
    image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600",
    display_order: 2,
    is_active: true,
  },
  {
    id: "slide-03",
    title: "Timeless spaces, enduring value.",
    subtitle: "Every estate thoroughly vetted for architectural permanence, clear title diligence, and long-term appreciation.",
    image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600",
    display_order: 3,
    is_active: true,
  },
];

async function getCloudConfigBanners(supabase: any) {
  try {
    const { data } = await supabase
      .from("properties")
      .select("ai_generated_summary")
      .eq("id", "__system_config_banners__")
      .single();

    if (data?.ai_generated_summary) {
      const parsed = JSON.parse(data.ai_generated_summary);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Continue to default
  }
  return DEFAULT_HERO_SLIDES;
}

async function saveCloudConfigBanners(supabase: any, banners: any[]) {
  return await supabase.from("properties").upsert({
    id: "__system_config_banners__",
    slug: "system-config-banners",
    title: "System Config Banners",
    location: "System Configuration",
    type: "System",
    status: "Draft",
    total_price: 0,
    cover_image: banners[0]?.image_url || DEFAULT_HERO_SLIDES[0].image_url,
    ai_generated_summary: JSON.stringify(banners),
    updated_at: new Date().toISOString(),
  });
}

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ success: true, banners: data, source: "supabase_table" });
    }
  } catch (err) {
    console.warn("[Banners GET Supabase Table Error]", err);
  }

  // Authoritative Cloud Fallback via system configuration row
  const cloudBanners = await getCloudConfigBanners(supabase);
  return NextResponse.json({
    success: true,
    banners: cloudBanners,
    source: "supabase_cloud_config",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const banner = body.banner || body;
    if (!banner || !banner.title) {
      return NextResponse.json({ error: "Banner title and image required" }, { status: 400 });
    }

    const id = banner.id || `banner_${Date.now()}`;
    const row = {
      id,
      title: banner.title,
      subtitle: banner.subtitle || banner.sub || "",
      image_url: banner.image_url || banner.imageUrl || banner.img || banner.image || "",
      link_url: banner.link_url || banner.link || null,
      display_order: typeof banner.display_order === "number" ? banner.display_order : (banner.displayOrder || 1),
      is_active: banner.is_active !== undefined ? banner.is_active : (banner.active !== undefined ? banner.active : true),
      updated_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();

    // 1. Try dedicated table
    try {
      const { data, error } = await (supabase.from("banners") as any).upsert(row).select().single();
      if (!error && data) {
        return NextResponse.json({ success: true, banner: data });
      }
    } catch {
      // Table not ready, proceed to cloud config
    }

    // 2. Cloud Fallback Persistence
    const currentList = await getCloudConfigBanners(supabase);
    const existingIdx = currentList.findIndex((b: any) => b.id === id);
    let updatedList;
    if (existingIdx >= 0) {
      updatedList = currentList.map((b: any, idx: number) => (idx === existingIdx ? { ...b, ...row } : b));
    } else {
      updatedList = [row, ...currentList];
    }

    await saveCloudConfigBanners(supabase, updatedList);
    return NextResponse.json({ success: true, banner: row, source: "supabase_cloud_config" });
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
      return NextResponse.json({ error: "Banner ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Try dedicated table
    try {
      await supabase.from("banners").delete().eq("id", id);
    } catch {
      // Ignore
    }

    // 2. Cloud Fallback Persistence
    const currentList = await getCloudConfigBanners(supabase);
    const updatedList = currentList.filter((b: any) => b.id !== id);
    await saveCloudConfigBanners(supabase, updatedList);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, is_active, active, display_order } = body;
    if (!id) {
      return NextResponse.json({ error: "Banner ID required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) updates.is_active = is_active;
    if (active !== undefined) updates.is_active = active;
    if (display_order !== undefined) updates.display_order = display_order;

    const supabase = createAdminClient();

    // 1. Try dedicated table
    try {
      const { data, error } = await (supabase.from("banners") as any).update(updates).eq("id", id).select().single();
      if (!error && data) {
        return NextResponse.json({ success: true, banner: data });
      }
    } catch {
      // Ignore
    }

    // 2. Cloud Fallback Persistence
    const currentList = await getCloudConfigBanners(supabase);
    const updatedList = currentList.map((b: any) => (b.id === id ? { ...b, ...updates } : b));
    await saveCloudConfigBanners(supabase, updatedList);

    return NextResponse.json({ success: true, banner: { id, ...updates } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

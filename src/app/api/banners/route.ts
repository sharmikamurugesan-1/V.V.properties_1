import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      return NextResponse.json({ success: true, banners: data, source: "supabase" });
    }
  } catch (err) {
    console.warn("[Banners GET Supabase Error]", err);
  }

  // Fallback default sample banners if table not populated yet
  return NextResponse.json({
    success: true,
    banners: [],
    source: "default",
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
    const supabase = createAdminClient();

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

    const { data, error } = await (supabase.from("banners") as any)
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.error("[Banners POST Error]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, banner: data });
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
    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      console.error("[Banners DELETE Error]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

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
    const { data, error } = await (supabase.from("banners") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, banner: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data) {
      return NextResponse.json({ success: true, testimonials: data, source: "supabase" });
    }
  } catch (err) {
    console.warn("[Testimonials GET Supabase Error]", err);
  }

  return NextResponse.json({
    success: true,
    testimonials: [],
    source: "default",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = body.testimonial || body;
    if (!item || !item.client_name && !item.name) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }
    if (!item.content && !item.quote) {
      return NextResponse.json({ error: "Review content / quote is required" }, { status: 400 });
    }

    const id = item.id || `test_${Date.now()}`;
    const supabase = createAdminClient();

    const row = {
      id,
      client_name: item.client_name || item.name,
      location: item.location || "Coimbatore",
      rating: parseInt(String(item.rating || item.stars || 5), 10),
      content: item.content || item.quote,
      photo_url: item.photo_url || item.photo || null,
      is_verified: item.is_verified !== undefined ? item.is_verified : true,
      is_visible: item.is_visible !== undefined ? item.is_visible : true,
      display_order: typeof item.display_order === "number" ? item.display_order : 1,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from("testimonials") as any)
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.error("[Testimonials POST Error]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, testimonial: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[Testimonials POST Fatal Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Testimonial ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) {
      console.error("[Testimonials DELETE Error]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[Testimonials DELETE Fatal Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_TESTIMONIALS = [
  {
    id: "test-01",
    client_name: "Dr. K. Arumugam & Family",
    location: "Race Course, Coimbatore",
    rating: 5,
    content: "V.V. Properties delivered title diligence and absolute clarity for our family ancestral estate acquisition. Exceptional transparency throughout the registration.",
    is_verified: true,
    is_visible: true,
    display_order: 1,
  },
  {
    id: "test-02",
    client_name: "Siddharthan Ramanathan",
    location: "Whitefield, Bengaluru",
    rating: 5,
    content: "The advisory team vetted the DTCP approvals and managed clear documentation without any surprises. Highly recommended for overseas investors.",
    is_verified: true,
    is_visible: true,
    display_order: 2,
  },
  {
    id: "test-03",
    client_name: "Meera & Rajesh Nair",
    location: "Kavundampalayam, Coimbatore",
    rating: 5,
    content: "From initial site visit in their chauffeur car to transparent deed transfer, the experience was premium and trustworthy.",
    is_verified: true,
    is_visible: true,
    display_order: 3,
  },
];

async function getCloudConfigTestimonials(supabase: any) {
  try {
    const { data } = await supabase
      .from("properties")
      .select("ai_generated_summary")
      .eq("id", "__system_config_testimonials__")
      .single();

    if (data?.ai_generated_summary) {
      const parsed = JSON.parse(data.ai_generated_summary);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Continue
  }
  return DEFAULT_TESTIMONIALS;
}

async function saveCloudConfigTestimonials(supabase: any, testimonials: any[]) {
  return await supabase.from("properties").upsert({
    id: "__system_config_testimonials__",
    slug: "system-config-testimonials",
    title: "System Config Testimonials",
    location: "System Configuration",
    type: "System",
    status: "Draft",
    total_price: 0,
    cover_image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    ai_generated_summary: JSON.stringify(testimonials),
    updated_at: new Date().toISOString(),
  });
}

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ success: true, testimonials: data, source: "supabase_table" });
    }
  } catch (err) {
    console.warn("[Testimonials GET Supabase Error]", err);
  }

  const cloudList = await getCloudConfigTestimonials(supabase);
  return NextResponse.json({
    success: true,
    testimonials: cloudList,
    source: "supabase_cloud_config",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = body.testimonial || body;
    if (!item || (!item.client_name && !item.name)) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }
    if (!item.content && !item.quote) {
      return NextResponse.json({ error: "Review content / quote is required" }, { status: 400 });
    }

    const id = item.id || `test_${Date.now()}`;
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

    const supabase = createAdminClient();

    // 1. Try dedicated table
    try {
      const { data, error } = await (supabase.from("testimonials") as any)
        .upsert(row)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, testimonial: data });
      }
    } catch {
      // Proceed to cloud config
    }

    // 2. Cloud Fallback Persistence
    const currentList = await getCloudConfigTestimonials(supabase);
    const existingIdx = currentList.findIndex((t: any) => t.id === id);
    let updatedList;
    if (existingIdx >= 0) {
      updatedList = currentList.map((t: any, idx: number) => (idx === existingIdx ? { ...t, ...row } : t));
    } else {
      updatedList = [row, ...currentList];
    }

    await saveCloudConfigTestimonials(supabase, updatedList);
    return NextResponse.json({ success: true, testimonial: row, source: "supabase_cloud_config" });
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
      return NextResponse.json({ error: "Testimonial ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Try dedicated table
    try {
      await supabase.from("testimonials").delete().eq("id", id);
    } catch {
      // Ignore
    }

    // 2. Cloud Fallback Persistence
    const currentList = await getCloudConfigTestimonials(supabase);
    const updatedList = currentList.filter((t: any) => t.id !== id);
    await saveCloudConfigTestimonials(supabase, updatedList);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

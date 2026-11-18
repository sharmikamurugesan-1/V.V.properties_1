import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createUserServerClient } from "@/lib/supabase/server";
import { isManagement, isAgent } from "@/lib/rbac";

const inquirySchema = z.object({
  propertyId: z.string().optional().nullable(),
  clientName: z.string().min(2, "Full name required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  inquiryType: z.enum([
    "general",
    "site-visit",
    "plot-reservation",
    "brochure",
    "cost-sheet",
    "investment-consultation"
  ]).default("general"),
  budgetRange: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  needCabPickup: z.boolean().default(false),
  message: z.string().max(800).optional(),
  source: z.string().default("Website Property Page"),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const supabase = createAdminClient();

    let query = supabase
      .from("inquiries")
      .select(`
        *,
        properties:property_id (id, title, location, price_display, cover_image)
      `)
      .order("created_at", { ascending: false });

    // Enforce role visibility
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const userClient = createUserServerClient(token);
      const { data: { user } } = await userClient.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = (profile as any)?.role;

        if (isAgent(role)) {
          // Agent only sees leads assigned to them
          query = query.eq("assigned_agent_id", user.id);
        } else if (!isManagement(role)) {
          return NextResponse.json({ error: "Access denied. Management credentials required." }, { status: 403 });
        }
      }
    }

    const { data: inquiries, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiries });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    const { data: newInquiry, error } = await (supabase
      .from("inquiries") as any)
      .insert({
        property_id: data.propertyId || null,
        client_name: data.clientName.trim(),
        phone: data.phone.trim(),
        email: data.email ? data.email.trim() : null,
        inquiry_type: data.inquiryType,
        budget_range: data.budgetRange || null,
        preferred_date: data.preferredDate || null,
        preferred_time: data.preferredTime || null,
        need_cab_pickup: data.needCabPickup,
        message: data.message || null,
        source: data.source,
        status: "New",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Lead recorded in executive pipeline. Relationship manager notified.",
      inquiry: newInquiry,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, assignedAgentId, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: "Inquiry ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (assignedAgentId !== undefined) updates.assigned_agent_id = assignedAgentId;
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;

    const { data: updated, error } = await (supabase
      .from("inquiries") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry pipeline updated successfully",
      inquiry: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createUserServerClient } from "@/lib/supabase/server";
import { isManagement, isAgent } from "@/lib/rbac";

const siteVisitSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientPhone: z.string().min(10, "Valid phone number required"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Visit date must be in YYYY-MM-DD format"),
  timeSlot: z.string().min(3, "Time slot is required"),
  cabRequired: z.boolean().default(false),
  pickupLocation: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const supabase = createAdminClient();

    let query = supabase
      .from("site_visits")
      .select(`
        *,
        properties:property_id (id, title, location, total_price, price_display, cover_image)
      `)
      .order("visit_date", { ascending: true });

    // If an authenticated user token is present, evaluate role filters
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
          // Agents only see visits assigned to them
          query = query.eq("agent_id", user.id);
        } else if (!isManagement(role)) {
          // Regular users only see their own bookings
          query = query.eq("client_id", user.id);
        }
      }
    }

    const { data: visits, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, visits });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = siteVisitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    // Check for agent scheduling conflicts if an agent was requested
    const agentId = body.agentId || null;
    if (agentId) {
      const { data: existingConflict } = await supabase
        .from("site_visits")
        .select("id")
        .eq("agent_id", agentId)
        .eq("visit_date", data.visitDate)
        .eq("time_slot", data.timeSlot)
        .in("status", ["Pending", "Confirmed"])
        .single();

      if (existingConflict) {
        return NextResponse.json(
          { error: "The selected property consultant is already booked for this slot. Please pick another time slot." },
          { status: 409 }
        );
      }
    }

    // Insert site visit record (RLS and trigger will automatically log into activity_logs)
    const { data: newVisit, error } = await (supabase
      .from("site_visits") as any)
      .insert({
        property_id: data.propertyId,
        client_name: data.clientName.trim(),
        client_phone: data.clientPhone.trim(),
        client_email: data.clientEmail ? data.clientEmail.trim() : null,
        agent_id: agentId,
        visit_date: data.visitDate,
        time_slot: data.timeSlot,
        cab_required: data.cabRequired,
        pickup_location: data.pickupLocation || null,
        notes: data.notes || null,
        status: "Pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Site visit appointment scheduled successfully. Concierge confirmation will follow shortly.",
      visit: newVisit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, agentId, adminFeedback } = body;

    if (!id) {
      return NextResponse.json({ error: "Site visit ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (agentId !== undefined) updates.agent_id = agentId;
    if (adminFeedback !== undefined) updates.admin_feedback = adminFeedback;

    const { data: updated, error } = await (supabase
      .from("site_visits") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Site visit updated successfully",
      visit: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

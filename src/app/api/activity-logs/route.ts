import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      console.warn("[Supabase Activity Logs GET Error]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: data || [],
      count: (data || []).length,
      source: "supabase",
    });
  } catch (sbErr: unknown) {
    const message = sbErr instanceof Error ? sbErr.message : "Internal Server Error";
    console.error("[Supabase Activity Logs Fatal Error]", sbErr);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const logItem = body.log || body;
    if (!logItem) {
      return NextResponse.json({ error: "Missing log payload" }, { status: 400 });
    }

    const userName =
      logItem.user ||
      logItem.userName ||
      logItem.username ||
      logItem.name ||
      "Team Member";
    const userRole = logItem.role || "team_member";
    const action = logItem.action || "MANUAL_LOG";
    const entityType =
      logItem.module || logItem.section || logItem.entityType || "general";
    const entityId = logItem.entityId || logItem.id || null;

    const supabase = createAdminClient();
    const { data, error } = await (supabase.from("activity_logs") as any)
      .insert({
        user_name: userName,
        user_role: userRole,
        action: action,
        entity_type: entityType,
        entity_id: String(entityId || Date.now()),
        details: logItem.details || logItem,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase Activity Log Insert Error]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[Supabase Activity Log Post Fatal Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

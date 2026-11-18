import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/server";

const DATA_PATH = path.join(process.cwd(), "data", "activity_logs.json");

function getLocalLogs() {
  if (fs.existsSync(DATA_PATH)) {
    try {
      const raw = fs.readFileSync(DATA_PATH, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

function saveLocalLogs(logs: unknown) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch (e) {
    console.error(e);
  }
}

export async function GET() {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, logs: data, source: "supabase" });
      }
    }
  } catch (sbErr) {
    console.warn("[Supabase Activity Logs Warning]", sbErr);
  }

  const logs = getLocalLogs();
  return NextResponse.json({ success: true, logs, source: "local" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const logItem = body.log;
    if (!logItem) {
      return NextResponse.json({ error: "Missing log payload" }, { status: 400 });
    }

    if (!logItem.id) {
      logItem.id = `log_${Date.now()}`;
    }
    if (!logItem.timestamp) {
      logItem.timestamp = Date.now();
    }

    // 1. Supabase insert
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createAdminClient();
        await (supabase.from("activity_logs") as any).insert({
          user_name: logItem.user || logItem.userName || "Admin User",
          user_role: logItem.role || "super_admin",
          action: logItem.action || "MANUAL_LOG",
          entity_type: logItem.section || logItem.entityType || "dashboard",
          entity_id: logItem.id,
          details: logItem,
        });
      } catch (sbErr) {
        console.warn("[Supabase Activity Log Post Warning]", sbErr);
      }
    }

    // 2. Local fallback
    const logs = getLocalLogs();
    logs.unshift(logItem);
    const trimmed = logs.slice(0, 200);
    saveLocalLogs(trimmed);

    return NextResponse.json({ success: true, logs: trimmed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

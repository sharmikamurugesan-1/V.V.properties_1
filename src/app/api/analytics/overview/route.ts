import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Properties metrics
    const { data: properties, error: propErr } = await supabase
      .from("properties")
      .select("id, total_price, status, type");

    // 2. Inquiries metrics
    const { data: inquiries, error: inqErr } = await supabase
      .from("inquiries")
      .select("id, status, created_at");

    // 3. Site visits metrics
    const { data: visits, error: visitErr } = await supabase
      .from("site_visits")
      .select("id, status, visit_date");

    const rawProps: any[] = (properties as any[]) || [];
    const propList: any[] = rawProps.filter((p: any) => !String(p.id || "").startsWith("__system_config"));
    const inqList: any[] = (inquiries as any[]) || [];
    const visitList: any[] = (visits as any[]) || [];

    const totalProperties = propList.length;
    const draftProperties = propList.filter(
      (p: any) => String(p.status || "").toLowerCase() === "draft"
    ).length;
    const activeProperties = totalProperties - draftProperties;

    // Total Portfolio Valuation in Crores
    const totalValuationLakhs = propList.reduce((acc: number, p: any) => {
      const isSold = String(p.status || "").toLowerCase().includes("sold");
      const isDraft = String(p.status || "").toLowerCase() === "draft";
      if (!isSold && !isDraft) {
        return acc + Number(p.total_price || 0);
      }
      return acc;
    }, 0);

    const totalValuationCr = Number((totalValuationLakhs / 100).toFixed(2));

    const totalEnquiries = inqList.length;
    const newLeads = inqList.filter(
      (e: any) => String(e.status || "").toLowerCase() === "new"
    ).length;

    const totalSiteVisits = visitList.length;
    const confirmedVisits = visitList.filter(
      (v: any) =>
        String(v.status || "").toLowerCase() === "confirmed" ||
        String(v.status || "").toLowerCase() === "completed"
    ).length;

    // Conversion rate
    const closedDeals = inqList.filter((e: any) =>
      ["closed", "visit scheduled", "negotiation"].includes(
        String(e.status || "").toLowerCase()
      )
    ).length;

    const conversionRate =
      totalEnquiries > 0
        ? Number(((closedDeals / totalEnquiries) * 100).toFixed(1))
        : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalProperties,
        activeProperties,
        draftProperties,
        totalValuationCr,
        totalValuationLakhs,
        totalEnquiries,
        newLeads,
        totalSiteVisits,
        confirmedVisits,
        conversionRate,
      },
      source: "supabase",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

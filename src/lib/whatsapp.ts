import { COMPANY } from "@/config/company";

export interface PropertyWhatsAppContext {
  id?: string;
  title: string;
  location: string;
  priceDisplay?: string;
  slug?: string;
}

export interface AgentWhatsAppContext {
  fullName: string;
  phone?: string | null;
  designation?: string | null;
}

export interface SiteVisitWhatsAppContext {
  propertyTitle: string;
  location: string;
  visitDate: string;
  timeSlot: string;
  cabRequired?: boolean;
}

/**
 * Standardizes international phone format for WhatsApp wa.me links
 * Defaulting to Indian Country Code (+91) if not explicitly prefixed.
 */
function sanitizeWhatsAppNumber(phone?: string | null): string {
  if (!phone) {
    const defaultCompanyPhone = COMPANY?.whatsapp || "+91 98400 12345";
    return defaultCompanyPhone.replace(/[^0-9]/g, "");
  }

  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Generates an inquiry WhatsApp Click-to-Chat URL for a specific listing.
 * Includes property title, price, location, and dedicated agent if assigned.
 */
export function getWhatsAppPropertyInquiryUrl(
  property: PropertyWhatsAppContext,
  agent?: AgentWhatsAppContext | null,
  customNote?: string
): string {
  const targetPhone = sanitizeWhatsAppNumber(agent?.phone);
  
  const greeting = agent?.fullName 
    ? `Hello ${agent.fullName},`
    : `Hello V.V Properties Team,`;

  const propertyDetails = [
    greeting,
    `I am interested in acquiring more details regarding the following listing:`,
    `🏢 *${property.title}*`,
    `📍 *Location:* ${property.location}`,
    property.priceDisplay ? `💰 *Price:* ${property.priceDisplay}` : null,
    property.id ? `🆔 *Ref:* ${property.id}` : null,
    customNote ? `\n*Note:* ${customNote}` : null,
    `\nPlease share the detailed brochure, DTCP approval numbers, and availability chart.`
  ].filter(Boolean).join('\n');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(propertyDetails)}`;
}

/**
 * Generates an automated Site Visit confirmation/inquiry WhatsApp URL.
 */
export function getWhatsAppSiteVisitUrl(
  visit: SiteVisitWhatsAppContext,
  agent?: AgentWhatsAppContext | null
): string {
  const targetPhone = sanitizeWhatsAppNumber(agent?.phone);

  const message = [
    `Hello V.V Properties Executive Desk,`,
    `I would like to schedule an escorted private site inspection for:`,
    `🏡 *Property:* ${visit.propertyTitle}`,
    `📍 *Location:* ${visit.location}`,
    `📅 *Requested Date:* ${visit.visitDate}`,
    `⏰ *Preferred Time Slot:* ${visit.timeSlot}`,
    visit.cabRequired ? `🚗 *Complimentary Cab Service:* Requested` : null,
    `\nPlease confirm the site visit appointment and assign an executive concierge.`
  ].filter(Boolean).join('\n');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Fallback company WhatsApp link
 */
export function getWhatsAppUrl(customMessage?: string): string {
  const targetPhone = sanitizeWhatsAppNumber(COMPANY?.whatsapp);
  const message = customMessage || "Hello V.V Properties, I would like to enquire about your luxury plotted developments and signature residences.";
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

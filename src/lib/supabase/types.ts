export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'super_admin' | 'portfolio_director' | 'agent' | 'regular_user';
export type SiteVisitStatus = 'Pending' | 'Confirmed' | 'Rescheduled' | 'Completed' | 'Cancelled';
export type InquiryStatus = 'New' | 'Contacted' | 'Visit Scheduled' | 'Negotiation' | 'Closed' | 'Archived';
export type PropertyListingStatus = 'Available' | 'Fast Selling' | 'Selected Plots' | 'Ready to Construct' | 'Sold Out' | 'New Launch' | 'Draft';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          designation: string | null;
          avatar_url: string | null;
          is_active: boolean;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          designation?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          designation?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          title: string;
          slug: string;
          project_title: string | null;
          project_slug: string | null;
          type: string;
          location: string;
          corridor: string | null;
          price_per_cent: number | null;
          total_price: number;
          price_display: string | null;
          area_cents: number | null;
          area_sqft: number | null;
          bedrooms: number;
          bathrooms: number;
          status: PropertyListingStatus;
          badge: string | null;
          facing: string | null;
          road_width_ft: number | null;
          approvals: Json | null;
          dtcp_number: string | null;
          rera_number: string | null;
          cover_image: string;
          gallery: Json | null;
          amenities: Json | null;
          highlights: Json | null;
          description: string | null;
          ai_generated_summary: string | null;
          is_featured: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          project_title?: string | null;
          project_slug?: string | null;
          type?: string;
          location: string;
          corridor?: string | null;
          price_per_cent?: number | null;
          total_price: number;
          price_display?: string | null;
          area_cents?: number | null;
          area_sqft?: number | null;
          bedrooms?: number;
          bathrooms?: number;
          status?: PropertyListingStatus;
          badge?: string | null;
          facing?: string | null;
          road_width_ft?: number | null;
          approvals?: Json | null;
          dtcp_number?: string | null;
          rera_number?: string | null;
          cover_image: string;
          gallery?: Json | null;
          amenities?: Json | null;
          highlights?: Json | null;
          description?: string | null;
          ai_generated_summary?: string | null;
          is_featured?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          project_title?: string | null;
          project_slug?: string | null;
          type?: string;
          location?: string;
          corridor?: string | null;
          price_per_cent?: number | null;
          total_price?: number;
          price_display?: string | null;
          area_cents?: number | null;
          area_sqft?: number | null;
          bedrooms?: number;
          bathrooms?: number;
          status?: PropertyListingStatus;
          badge?: string | null;
          facing?: string | null;
          road_width_ft?: number | null;
          approvals?: Json | null;
          dtcp_number?: string | null;
          rera_number?: string | null;
          cover_image?: string;
          gallery?: Json | null;
          amenities?: Json | null;
          highlights?: Json | null;
          description?: string | null;
          ai_generated_summary?: string | null;
          is_featured?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_visits: {
        Row: {
          id: string;
          property_id: string;
          client_id: string | null;
          client_name: string;
          client_phone: string;
          client_email: string | null;
          agent_id: string | null;
          visit_date: string;
          time_slot: string;
          status: SiteVisitStatus;
          cab_required: boolean;
          pickup_location: string | null;
          notes: string | null;
          admin_feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          client_id?: string | null;
          client_name: string;
          client_phone: string;
          client_email?: string | null;
          agent_id?: string | null;
          visit_date: string;
          time_slot: string;
          status?: SiteVisitStatus;
          cab_required?: boolean;
          pickup_location?: string | null;
          notes?: string | null;
          admin_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          client_id?: string | null;
          client_name?: string;
          client_phone?: string;
          client_email?: string | null;
          agent_id?: string | null;
          visit_date?: string;
          time_slot?: string;
          status?: SiteVisitStatus;
          cab_required?: boolean;
          pickup_location?: string | null;
          notes?: string | null;
          admin_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inquiries: {
        Row: {
          id: string;
          property_id: string | null;
          client_name: string;
          phone: string;
          email: string | null;
          inquiry_type: string;
          budget_range: string | null;
          preferred_date: string | null;
          preferred_time: string | null;
          need_cab_pickup: boolean;
          message: string | null;
          source: string;
          status: InquiryStatus;
          assigned_agent_id: string | null;
          admin_notes: string | null;
          whatsapp_click_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          client_name: string;
          phone: string;
          email?: string | null;
          inquiry_type?: string;
          budget_range?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          need_cab_pickup?: boolean;
          message?: string | null;
          source?: string;
          status?: InquiryStatus;
          assigned_agent_id?: string | null;
          admin_notes?: string | null;
          whatsapp_click_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          client_name?: string;
          phone?: string;
          email?: string | null;
          inquiry_type?: string;
          budget_range?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          need_cab_pickup?: boolean;
          message?: string | null;
          source?: string;
          status?: InquiryStatus;
          assigned_agent_id?: string | null;
          admin_notes?: string | null;
          whatsapp_click_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_name: string;
          user_role: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_name?: string;
          user_role?: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_name?: string;
          user_role?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      match_properties: {
        Args: {
          p_min_budget?: number;
          p_max_budget?: number;
          p_preferred_location?: string;
          p_property_type?: string;
          p_min_bedrooms?: number;
          p_limit?: number;
        };
        Returns: {
          id: string;
          title: string;
          slug: string;
          type: string;
          location: string;
          total_price: number;
          price_display: string | null;
          bedrooms: number;
          status: PropertyListingStatus;
          cover_image: string;
          amenities: Json | null;
          match_score: number;
        }[];
      };
    };
  };
}

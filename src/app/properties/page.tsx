'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Loader2, Building, RefreshCw } from 'lucide-react';
import PropertyCard from '@/components/properties/PropertyCard';
import { supabase } from '@/lib/supabase/client';
import type { Property, PropertyType, PropertyStatus } from '@/types';

function rowToProperty(row: any): Property {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || 'Untitled Property',
    projectTitle: row.project_title || row.title || 'V.V Properties',
    projectSlug: row.project_slug || row.slug || row.id,
    type: (String(row.type || 'plot').toLowerCase() as PropertyType),
    location: row.location || 'Coimbatore',
    corridor: row.corridor || 'Coimbatore Region',
    areaCents: Number(row.area_cents || 0),
    areaSqFt: Number(row.area_sqft || 0),
    pricePerCent: Number(row.price_per_cent || 0),
    totalPrice: Number(row.total_price || 0),
    status: (row.status as PropertyStatus) || 'Available',
    approvals: Array.isArray(row.approvals) ? row.approvals : ['DTCP Approved', 'RERA Registered'],
    dtcpNumber: row.dtcp_number || 'DTCP/CBE/2026',
    reraNumber: row.rera_number || 'TN/11/Layout/2026',
    facing: row.facing || 'North-East',
    roadWidthFt: Number(row.road_width_ft || 40),
    featuredImage: row.cover_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    description: row.description || '',
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    distanceToITParkKm: Number(row.distance_to_it_park_km || 5),
    distanceToAirportKm: Number(row.distance_to_airport_km || 12),
    distanceToBusStandKm: Number(row.distance_to_bus_stand_km || 3),
    readyForConstruction: Boolean(row.ready_for_construction ?? true),
    clearTitle100Percent: Boolean(row.clear_title_100_percent ?? true),
    waterSupply: row.water_supply || '24/7 Siruvani Water',
    electricity: row.electricity || 'Underground EB Power',
    suitableFor: ['immediate-living', 'high-appreciation-investment'],
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveProperties = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/properties');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.properties)) {
          setProperties(json.properties.map(rowToProperty));
        }
      }
    } catch (err) {
      console.error('[PropertiesPage] Failed to fetch properties:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveProperties();

    // Supabase Realtime channel subscription
    const channel = supabase
      .channel('public_properties_page_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        () => {
          console.log('[PropertiesPage] Realtime change detected, refreshing...');
          void fetchLiveProperties();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchLiveProperties]);

  const filteredProperties = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return properties.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.projectTitle} ${p.location} ${p.corridor}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter !== 'all' && p.type !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [properties, searchTerm, typeFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#1565C0] mb-2">
              <Building className="w-4 h-4" />
              <span>Curated Portfolio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0E2138] tracking-tight">
              Verified Properties & Developments
            </h1>
            <p className="mt-2 text-sm text-[#4A6278] max-w-2xl leading-relaxed">
              Explore clear-title DTCP and RERA-approved plots, luxury villas, and planned land investments priced transparently in Indian Rupees (INR).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchLiveProperties()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#C8DFF0] bg-[#F7FAFD] text-xs font-semibold text-[#1565C0] hover:bg-[#E2EBF3] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>
            <span className="px-3.5 py-2 rounded-xl bg-[#0E2138] text-white text-xs font-bold">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'}
            </span>
          </div>
        </div>

        {/* ── Filters Bar ─────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94AAC0] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search properties by name, corridor, or location..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-[#C8DFF0] bg-[#F7FAFD] text-xs text-[#0E2138] placeholder:text-[#94AAC0] focus:outline-none focus:border-[#1565C0] focus:bg-white transition-colors shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#E2EBF3] transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-[#4A6278]" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-[#C8DFF0] bg-[#F7FAFD] text-xs font-semibold text-[#0E2138] focus:outline-none focus:border-[#1565C0]"
            >
              <option value="all">All Property Types</option>
              <option value="plot">Plot / Land</option>
              <option value="villa">Villa / Independent House</option>
              <option value="apartment">Apartment / Penthouse</option>
              <option value="farmland">Farmland / Estate</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-[#C8DFF0] bg-[#F7FAFD] text-xs font-semibold text-[#0E2138] focus:outline-none focus:border-[#1565C0]"
            >
              <option value="all">All Availability Statuses</option>
              <option value="Available">Available</option>
              <option value="New Launch">New Launch</option>
              <option value="Fast Selling">Fast Selling</option>
              <option value="Selected Plots">Selected Plots</option>
              <option value="Ready to Construct">Ready to Construct</option>
            </select>
          </div>
        </div>

        {/* ── Property Cards / Loading / Empty ─────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-96 animate-pulse rounded-2xl border border-[#C8DFF0] bg-[#F7FAFD]"
              />
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 rounded-2xl border border-dashed border-[#C8DFF0] bg-[#F7FAFD]">
            <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center text-[#1565C0] shadow-xs">
              <Building className="w-6 h-6" />
            </div>
            <p className="mt-4 text-lg font-bold text-[#0E2138]">No properties found matching criteria</p>
            <p className="text-xs text-[#4A6278] mt-1 max-w-md mx-auto">
              Our inventory is dynamically synced with Supabase. Clear your search or filter tags to view available listings.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#1565C0] text-white text-xs font-bold hover:bg-[#0D47A1] transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

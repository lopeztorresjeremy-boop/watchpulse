import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

// ─── Mappers: Supabase snake_case ↔ App camelCase ─────────

const mapTrackingFromDB = (r) => ({
  id: r.id, displayId: r.display_id, consultDate: r.consult_date, week: r.week, month: r.month, quarter: r.quarter,
  website: r.website, url: r.url || '', vendor: r.vendor || '', vendorReputation: r.vendor_reputation || '',
  brand: r.brand || '', model: r.model || '', reference: r.reference || '',
  publishedPrice: parseFloat(r.published_price) || 0, currency: r.currency || 'USD',
  isNew: r.is_new, includesBox: r.includes_box, hasRFID: r.has_rfid,
  warranty: r.warranty, worthRevisiting: r.worth_revisiting,
  trackingType: r.tracking_type, responsible: r.responsible,
  observations: r.observations || '', opportunityState: r.opportunity_state,
  recordState: r.record_state, targetPrice: parseFloat(r.target_price) || 0,
  createdAt: r.created_at,
});

const mapTrackingToDB = (f) => ({
  consult_date: f.consultDate, website: f.website, url: f.url,
  vendor: f.vendor, vendor_reputation: f.vendorReputation,
  brand: f.brand, model: f.model, reference: f.reference,
  published_price: f.publishedPrice || 0, currency: f.currency,
  is_new: f.isNew, includes_box: f.includesBox, has_rfid: f.hasRFID,
  warranty: f.warranty, worth_revisiting: f.worthRevisiting,
  tracking_type: f.trackingType, responsible: f.responsible,
  observations: f.observations, opportunity_state: f.opportunityState,
  record_state: f.recordState || 'Activo', target_price: f.targetPrice || 0,
});

const mapHistoryFromDB = (r) => ({
  id: r.id, displayId: r.display_id, trackingId: r.tracking_id,
  trackingDisplayId: r.tracking_display_id,
  revisionDate: r.revision_date, observedPrice: parseFloat(r.observed_price) || 0,
  currency: r.currency || 'USD',
  absoluteVariation: parseFloat(r.absolute_variation) || 0,
  percentVariation: parseFloat(r.percent_variation) || 0,
  isActive: r.is_active, source: r.source || '', observations: r.observations || '',
});

const mapHistoryToDB = (f) => ({
  tracking_id: f.trackingId, revision_date: f.revisionDate,
  observed_price: f.observedPrice || 0, currency: f.currency,
  absolute_variation: f.absoluteVariation || 0,
  percent_variation: f.percentVariation || 0,
  is_active: f.isActive, source: f.source, observations: f.observations,
});

const mapVendorFromDB = (r) => ({
  id: r.id, name: r.name, platform: r.platform || '', country: r.country || '',
  reputation: r.reputation || '', classification: r.classification,
  incidents: r.incidents || '', observations: r.observations || '',
  createdAt: r.created_at,
});

const mapVendorToDB = (f) => ({
  name: f.name, platform: f.platform, country: f.country,
  reputation: f.reputation, classification: f.classification,
  incidents: f.incidents, observations: f.observations,
});

// ─── Hook ────────────────────────────────────────────────

export function useSupabase() {
  const [trackings, setTrackings] = useState([]);
  const [history, setHistory] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── FETCH ALL ─────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, hRes, vRes, bRes] = await Promise.all([
        supabase.from('trackings').select('*').order('consult_date', { ascending: false }),
        supabase.from('price_history').select('*').order('revision_date', { ascending: true }),
        supabase.from('vendors').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
      ]);
      if (tRes.error) throw tRes.error;
      if (hRes.error) throw hRes.error;
      if (vRes.error) throw vRes.error;
      if (bRes.error) throw bRes.error;

      setTrackings((tRes.data || []).map(mapTrackingFromDB));
      setHistory((hRes.data || []).map(mapHistoryFromDB));
      setVendors((vRes.data || []).map(mapVendorFromDB));
      setBrands((bRes.data || []).map(b => b.name));
    } catch (err) {
      console.error('Supabase fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── TRACKINGS CRUD ────────────────────────────────────
  const saveTracking = async (form, editId) => {
    const data = mapTrackingToDB(form);
    let result;
    if (editId) {
      result = await supabase.from('trackings').update(data).eq('id', editId).select().single();
    } else {
      result = await supabase.from('trackings').insert(data).select().single();
    }
    if (result.error) throw result.error;
    await fetchAll();
    return mapTrackingFromDB(result.data);
  };

  const deleteTracking = async (id) => {
    const { error } = await supabase.from('trackings').delete().eq('id', id);
    if (error) throw error;
    setTrackings(p => p.filter(t => t.id !== id));
  };

  const toggleRevisit = async (id, current) => {
    const { error } = await supabase.from('trackings').update({ worth_revisiting: !current }).eq('id', id);
    if (error) throw error;
    setTrackings(p => p.map(t => t.id === id ? { ...t, worthRevisiting: !current } : t));
  };

  // ─── HISTORY CRUD ──────────────────────────────────────
  const saveHistory = async (form, editId) => {
    const data = mapHistoryToDB(form);
    let result;
    if (editId) {
      result = await supabase.from('price_history').update(data).eq('id', editId).select().single();
    } else {
      result = await supabase.from('price_history').insert(data).select().single();
    }
    if (result.error) throw result.error;
    await fetchAll();
    return mapHistoryFromDB(result.data);
  };

  const deleteHistory = async (id) => {
    const { error } = await supabase.from('price_history').delete().eq('id', id);
    if (error) throw error;
    setHistory(p => p.filter(h => h.id !== id));
  };

  // ─── VENDORS CRUD ──────────────────────────────────────
  const saveVendor = async (form, editId) => {
    const data = mapVendorToDB(form);
    let result;
    if (editId) {
      result = await supabase.from('vendors').update(data).eq('id', editId).select().single();
    } else {
      result = await supabase.from('vendors').insert(data).select().single();
    }
    if (result.error) throw result.error;
    await fetchAll();
    return mapVendorFromDB(result.data);
  };

  const deleteVendor = async (id) => {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
    setVendors(p => p.filter(v => v.id !== id));
  };

  // ─── BRANDS ────────────────────────────────────────────
  const addBrand = async (name) => {
    const clean = name.trim().toUpperCase();
    if (!clean || brands.includes(clean)) return;
    const { error } = await supabase.from('brands').insert({ name: clean });
    if (error && error.code !== '23505') throw error; // ignore unique violation
    setBrands(p => [...p, clean].sort());
  };

  return {
    trackings, history, vendors, brands, loading, error,
    fetchAll, saveTracking, deleteTracking, toggleRevisit,
    saveHistory, deleteHistory,
    saveVendor, deleteVendor, addBrand,
  };
}

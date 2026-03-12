-- ═══════════════════════════════════════════════════════════
-- WATCHPULSE — Supabase Database Schema
-- Ejecutar este SQL completo en: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- 1. TABLA: marcas
CREATE TABLE IF NOT EXISTS brands (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO brands (name) VALUES ('SEIKO'), ('TISSOT'), ('BULOVA'), ('ORIENT')
ON CONFLICT (name) DO NOTHING;

-- 2. TABLA: vendedores
CREATE TABLE IF NOT EXISTS vendors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT,
  country TEXT,
  reputation TEXT,
  classification TEXT DEFAULT 'En observación'
    CHECK (classification IN ('Confiable', 'En observación', 'Riesgoso', 'Descartado')),
  incidents TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: seguimientos
CREATE TABLE IF NOT EXISTS trackings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  display_id TEXT UNIQUE,
  consult_date DATE NOT NULL DEFAULT CURRENT_DATE,
  week INT,
  month INT,
  quarter INT,
  website TEXT NOT NULL
    CHECK (website IN ('eBay', 'Amazon', 'Jomashop', 'CreationWatches')),
  url TEXT DEFAULT '',
  vendor TEXT DEFAULT '',
  vendor_reputation TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  reference TEXT DEFAULT '',
  published_price NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_new BOOLEAN DEFAULT TRUE,
  includes_box BOOLEAN DEFAULT TRUE,
  has_rfid BOOLEAN DEFAULT FALSE,
  warranty TEXT DEFAULT 'Fabricante'
    CHECK (warranty IN ('Fabricante', 'No especifica', 'Sin garantía')),
  worth_revisiting BOOLEAN DEFAULT FALSE,
  tracking_type TEXT DEFAULT 'Solo referencia de mercado'
    CHECK (tracking_type IN ('Posible compra futura', 'Solo referencia de mercado')),
  responsible TEXT DEFAULT 'Christian'
    CHECK (responsible IN ('Christian', 'Jeremy')),
  observations TEXT DEFAULT '',
  opportunity_state TEXT DEFAULT 'Solo seguimiento'
    CHECK (opportunity_state IN ('Buena opción', 'Solo seguimiento', 'No conviene')),
  record_state TEXT DEFAULT 'Activo'
    CHECK (record_state IN ('Activo', 'Incompleto', 'Fuera de criterio', 'Archivado')),
  target_price NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: histórico de precios
CREATE TABLE IF NOT EXISTS price_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  display_id TEXT UNIQUE,
  tracking_id BIGINT NOT NULL REFERENCES trackings(id) ON DELETE CASCADE,
  tracking_display_id TEXT,
  revision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  observed_price NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  absolute_variation NUMERIC(12,2) DEFAULT 0,
  percent_variation NUMERIC(8,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT ''
    CHECK (source IN ('', 'eBay', 'Amazon', 'Jomashop', 'CreationWatches')),
  observations TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- FUNCIONES AUTOMÁTICAS
-- ═══════════════════════════════════════════════════════════

-- Generar display_id automático para seguimientos (SEG-001, SEG-002...)
CREATE OR REPLACE FUNCTION generate_tracking_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_id := 'SEG-' || LPAD(NEW.id::TEXT, 3, '0');
  -- Calcular semana, mes, trimestre
  NEW.week := EXTRACT(WEEK FROM NEW.consult_date);
  NEW.month := EXTRACT(MONTH FROM NEW.consult_date);
  NEW.quarter := EXTRACT(QUARTER FROM NEW.consult_date);
  -- Validar registro incompleto
  IF NEW.brand = '' OR NEW.model = '' OR NEW.published_price = 0 THEN
    NEW.record_state := 'Incompleto';
  END IF;
  IF NEW.is_new = FALSE THEN
    NEW.record_state := 'Fuera de criterio';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_tracking_display_id
  BEFORE INSERT ON trackings
  FOR EACH ROW
  EXECUTE FUNCTION generate_tracking_display_id();

-- Actualizar semana/mes/trimestre y estado en UPDATE
CREATE OR REPLACE FUNCTION update_tracking_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.week := EXTRACT(WEEK FROM NEW.consult_date);
  NEW.month := EXTRACT(MONTH FROM NEW.consult_date);
  NEW.quarter := EXTRACT(QUARTER FROM NEW.consult_date);
  NEW.updated_at := NOW();
  IF NEW.brand = '' OR NEW.model = '' OR NEW.published_price = 0 THEN
    NEW.record_state := 'Incompleto';
  ELSIF NEW.is_new = FALSE THEN
    NEW.record_state := 'Fuera de criterio';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_tracking_update
  BEFORE UPDATE ON trackings
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_fields();

-- Generar display_id para histórico (H-001, H-002...)
CREATE OR REPLACE FUNCTION generate_history_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_id := 'H-' || LPAD(NEW.id::TEXT, 3, '0');
  -- Obtener tracking_display_id
  SELECT display_id INTO NEW.tracking_display_id
    FROM trackings WHERE id = NEW.tracking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_history_display_id
  BEFORE INSERT ON price_history
  FOR EACH ROW
  EXECUTE FUNCTION generate_history_display_id();

-- Actualizar updated_at en vendedores
CREATE OR REPLACE FUNCTION update_vendor_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_vendor_update
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_timestamp();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (acceso público para lectura/escritura)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on trackings" ON trackings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on price_history" ON price_history FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- DATOS DEMO (opcional — puedes comentar esta sección)
-- ═══════════════════════════════════════════════════════════

INSERT INTO vendors (name, platform, country, reputation, classification, incidents, observations) VALUES
  ('WatchNation', 'eBay', 'USA', '99.2%', 'Confiable', '', 'Envío rápido, embalaje excelente'),
  ('TimeKeeper_Store', 'eBay', 'USA', '98.5%', 'Confiable', '', 'Buen vendedor, precios competitivos'),
  ('GlobalWatch', 'Amazon', 'USA', '4.6/5', 'En observación', '1 retraso en envío', 'Revisar próxima compra'),
  ('Jomashop Official', 'Jomashop', 'USA', '4.8/5', 'Confiable', '', 'Distribuidor autorizado'),
  ('CheapWatches_Deals', 'eBay', 'China', '94.1%', 'Riesgoso', '2 productos no originales', 'No comprar sin verificar');

INSERT INTO trackings (consult_date, website, url, vendor, vendor_reputation, brand, model, reference, published_price, currency, is_new, includes_box, has_rfid, warranty, worth_revisiting, tracking_type, responsible, observations, opportunity_state, record_state, target_price) VALUES
  ('2026-03-10', 'eBay', 'https://ebay.com/itm/12345', 'WatchNation', '99.2%', 'SEIKO', 'Presage', 'SRPD37', 285.00, 'USD', true, true, true, 'Fabricante', true, 'Posible compra futura', 'Christian', 'Precio bajo vs mercado promedio $320', 'Buena opción', 'Activo', 270),
  ('2026-03-09', 'Amazon', 'https://amazon.com/dp/B08XYZ', 'GlobalWatch', '4.6/5', 'TISSOT', 'PRX', 'T137.410.11.041.00', 345.00, 'USD', true, true, false, 'Fabricante', true, 'Posible compra futura', 'Jeremy', 'Color azul, alta demanda', 'Buena opción', 'Activo', 300),
  ('2026-03-08', 'Jomashop', 'https://jomashop.com/orient-123', 'Jomashop Official', '4.8/5', 'ORIENT', 'Bambino', 'RA-AC0M01S10B', 198.50, 'USD', true, true, false, 'No especifica', false, 'Solo referencia de mercado', 'Christian', 'Sin RFID, verificar', 'Solo seguimiento', 'Activo', 180),
  ('2026-03-07', 'eBay', 'https://ebay.com/itm/67890', 'CheapWatches_Deals', '94.1%', 'SEIKO', '5 Sports', 'SRPD55', 145.00, 'USD', true, false, false, 'Sin garantía', false, 'Solo referencia de mercado', 'Jeremy', 'Vendedor riesgoso', 'No conviene', 'Activo', 0),
  ('2026-03-06', 'eBay', 'https://ebay.com/itm/bulova-96A225', 'TimeKeeper_Store', '98.5%', 'BULOVA', 'Lunar Pilot', '96A225', 399.00, 'USD', true, true, true, 'Fabricante', true, 'Posible compra futura', 'Christian', 'Modelo muy buscado', 'Buena opción', 'Activo', 370);

-- Insertar histórico vinculado al primer tracking (SEIKO Presage)
INSERT INTO price_history (tracking_id, tracking_display_id, revision_date, observed_price, currency, absolute_variation, percent_variation, is_active, source, observations) VALUES
  (1, 'SEG-001', '2026-01-20', 325.00, 'USD', 0, 0, true, 'eBay', 'Primer registro'),
  (1, 'SEG-001', '2026-02-15', 310.00, 'USD', -15, -4.62, true, 'eBay', 'Bajó $15'),
  (1, 'SEG-001', '2026-03-10', 285.00, 'USD', -25, -8.06, true, 'eBay', 'Caída adicional — oportunidad'),
  (5, 'SEG-005', '2026-02-01', 425.00, 'USD', 0, 0, true, 'eBay', 'Primer registro'),
  (5, 'SEG-005', '2026-03-06', 399.00, 'USD', -26, -6.12, true, 'eBay', 'Bajó $26');

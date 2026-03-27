-- ============================================
-- Clinica Arca - 05: Seed Data
-- ============================================

-- Insurance Partners
INSERT INTO insurance_partners (name, logo_url, contact_info, status, display_order) VALUES
    ('Rímac Seguros',   NULL, 'Tel: 01-411-1111', 'active', 1),
    ('Pacífico Seguros', NULL, 'Tel: 01-513-6300', 'active', 2),
    ('MAPFRE',           NULL, 'Tel: 01-213-3333', 'active', 3);

-- Procedures
INSERT INTO procedures (name, description, category, base_price, estimated_duration_minutes) VALUES
    ('Limpieza dental',      'Limpieza dental profesional con ultrasonido',    'general',     80.00,  45),
    ('Extracción simple',    'Extracción de pieza dental sin complicaciones',  'cirugia',    120.00,  30),
    ('Ortodoncia brackets',  'Tratamiento de ortodoncia con brackets metálicos', 'ortodoncia', 3500.00, 60),
    ('Implante dental',      'Implante de titanio con corona de porcelana',    'implantes',  4500.00, 90),
    ('Blanqueamiento',       'Blanqueamiento dental con láser',                'estetica',    350.00, 60);

-- Clinic Settings
INSERT INTO clinic_settings (key, value, description) VALUES
    ('clinic_name',    '"Clínica Arca"',                                                          'Nombre de la clínica'),
    ('clinic_phone',   '"+51 1 234 5678"',                                                        'Teléfono principal'),
    ('clinic_address', '"Av. Ejemplo 123, Lima, Perú"',                                           'Dirección de la clínica'),
    ('working_hours',  '{"lunes_viernes": "08:00 - 20:00", "sabado": "08:00 - 14:00"}',          'Horarios de atención');

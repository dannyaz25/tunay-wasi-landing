#!/bin/bash
# seed-lotes.sh — carga productos y ciclo activo en Firestore via REST API
# Uso: bash scripts/seed-lotes.sh

set -e

TOKEN=$(gcloud auth application-default print-access-token)
BASE="https://firestore.googleapis.com/v1/projects/tunay-wasi/databases/default/documents"

echo "🌱 Cargando datos en tunay-wasi..."

# ── Producto 1: Geisha Honey - Aydee Rojas ────────────────────────────────────
curl -s -X PATCH \
  "$BASE/productos/geisha-honey-aydee-2026" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "code":          { "stringValue": "01" },
      "name":          { "stringValue": "Aydee Rojas - Geisha Honey" },
      "sub":           { "stringValue": "Honey · Amazonas" },
      "region":        { "stringValue": "Perú · Amazonas" },
      "alt":           { "stringValue": "1500 m" },
      "farm":          { "stringValue": "Finca Aydee Rojas" },
      "producer":      { "stringValue": "Aydee Rojas Saldivar" },
      "body":          { "stringValue": "Medio" },
      "acidity":       { "stringValue": "Brillante" },
      "score":         { "stringValue": "86+" },
      "tag":           { "stringValue": "Geisha Honey" },
      "tagTone":       { "stringValue": "terra" },
      "tone":          { "stringValue": "green" },
      "stockKg":       { "doubleValue": 24 },
      "stockReservedKg": { "doubleValue": 0 },
      "producerPct":   { "integerValue": 42 },
      "label":         { "stringValue": "PREVENTA" },
      "desc":          { "stringValue": "Microlote Geisha proceso Honey de Aydee Rojas, en secado. Cosecha 2026. Cantidad limitada: 24 kg." },
      "notes":         { "arrayValue": { "values": [
        { "stringValue": "Frutal" },
        { "stringValue": "Miel" },
        { "stringValue": "Floral" }
      ]}},
      "brews":         { "arrayValue": { "values": [
        { "stringValue": "V60" },
        { "stringValue": "Chemex" },
        { "stringValue": "Aeropress" }
      ]}},
      "weights":       { "arrayValue": { "values": [
        { "mapValue": { "fields": {
          "label": { "stringValue": "250g" },
          "cents": { "integerValue": 7800 }
        }}},
        { "mapValue": { "fields": {
          "label": { "stringValue": "1kg" },
          "cents": { "integerValue": 28000 }
        }}}
      ]}}
    }
  }' > /dev/null && echo "✅ productos/geisha-honey-aydee-2026"

# ── Producto 2: Bourbon Lavado - Jon Sánchez ──────────────────────────────────
curl -s -X PATCH \
  "$BASE/productos/bourbon-lavado-jon-milan-2026" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "code":          { "stringValue": "02" },
      "name":          { "stringValue": "Las Travesuras de Milán - Bourbon" },
      "sub":           { "stringValue": "Lavado · Cajamarca" },
      "region":        { "stringValue": "Perú · Cajamarca" },
      "alt":           { "stringValue": "1550 m" },
      "farm":          { "stringValue": "Finca Darlyn Sánchez" },
      "producer":      { "stringValue": "Darlyn John Sánchez Hilario" },
      "body":          { "stringValue": "Medio-alto" },
      "acidity":       { "stringValue": "Cítrica limpia" },
      "score":         { "stringValue": "86+" },
      "tag":           { "stringValue": "Bourbon Lavado" },
      "tagTone":       { "stringValue": "sage" },
      "tone":          { "stringValue": "tan" },
      "stockKg":       { "doubleValue": 300 },
      "stockReservedKg": { "doubleValue": 0 },
      "producerPct":   { "integerValue": 42 },
      "label":         { "stringValue": "PREVENTA" },
      "desc":          { "stringValue": "Microlote Bourbon proceso Lavado de Jon Sánchez. En fermentación, disponible julio 2026. 300 kg." },
      "notes":         { "arrayValue": { "values": [
        { "stringValue": "Caramelo" },
        { "stringValue": "Cítrico" },
        { "stringValue": "Chocolate" }
      ]}},
      "brews":         { "arrayValue": { "values": [
        { "stringValue": "V60" },
        { "stringValue": "French Press" },
        { "stringValue": "Espresso" }
      ]}},
      "weights":       { "arrayValue": { "values": [
        { "mapValue": { "fields": {
          "label": { "stringValue": "250g" },
          "cents": { "integerValue": 7200 }
        }}},
        { "mapValue": { "fields": {
          "label": { "stringValue": "1kg" },
          "cents": { "integerValue": 26000 }
        }}},
        { "mapValue": { "fields": {
          "label": { "stringValue": "3kg" },
          "cents": { "integerValue": 75000 }
        }}}
      ]}}
    }
  }' > /dev/null && echo "✅ productos/bourbon-lavado-jon-milan-2026"

# ── Ciclo activo ──────────────────────────────────────────────────────────────
curl -s -X PATCH \
  "$BASE/configurations/ciclo_activo" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "closeAt":          { "stringValue": "31 may." },
      "deliverLima":      { "stringValue": "jun. (1a semana)" },
      "deliverProv":      { "stringValue": "jun. (2a semana)" },
      "cutoffTimestamp":  { "integerValue": 1748739599000 }
    }
  }' > /dev/null && echo "✅ configurations/ciclo_activo"

echo ""
echo "🎉 Listo. Abre la landing y verifica el catálogo."

# ── Landing config (heroMetrics) ──────────────────────────────────────────────
curl -s -X PATCH \
  "$BASE/configurations/landing" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "heroMetrics": { "mapValue": { "fields": {
        "producerPctDisplay": { "integerValue": 42 },
        "farmCount":          { "integerValue": 2 },
        "altitudMedia":       { "stringValue": "1,500 m" }
      }}},
      "contact": { "mapValue": { "fields": {
        "email":      { "stringValue": "tunaywasi@gmail.com" },
        "whatsapp":   { "stringValue": "+51917959370" },
        "address":    { "stringValue": "Amazonas · Cajamarca, Perú" },
        "adminEmail": { "stringValue": "tunaywasi@gmail.com" }
      }}}
    }
  }' > /dev/null && echo "✅ configurations/landing"

# ── Caficultor 1: Aydee Rojas Saldivar ───────────────────────────────────────
curl -s -X PATCH \
  "$BASE/caficultores/aydee-rojas-2026" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "nombreProductor":  { "stringValue": "Aydee Rojas Saldivar" },
      "nombreFinca":      { "stringValue": "Finca Aydee Rojas" },
      "provincia":        { "stringValue": "Bagua" },
      "departamento":     { "stringValue": "Amazonas" },
      "distrito":         { "stringValue": "Bagua Grande" },
      "altitud":          { "stringValue": "1500" },
      "variedad":         { "stringValue": "Geisha" },
      "proceso":          { "stringValue": "Honey" },
      "puntajeSCA":       { "stringValue": "86+" },
      "resumen":          { "stringValue": "Productora de microlotes Geisha Honey en Amazonas, con 24 kg de cosecha 2026 en secado." },
      "historia":         { "stringValue": "Aydee cultiva Geisha en las alturas de Amazonas, seleccionando cerezas en su punto exacto de madurez para el proceso Honey." },
      "impactoSocial":    { "stringValue": "Producción familiar en Amazonas, preservando variedades de especialidad en la región." },
      "status":           { "stringValue": "aprobado" }
    }
  }' > /dev/null && echo "✅ caficultores/aydee-rojas-2026"

# ── Caficultor 2: Darlyn John Sánchez Hilario ─────────────────────────────────
curl -s -X PATCH \
  "$BASE/caficultores/darlyn-sanchez-2026" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "nombreProductor":  { "stringValue": "Darlyn John Sánchez Hilario" },
      "nombreFinca":      { "stringValue": "Las Travesuras de Milán" },
      "provincia":        { "stringValue": "Bagua" },
      "departamento":     { "stringValue": "Amazonas" },
      "distrito":         { "stringValue": "Bagua Grande" },
      "altitud":          { "stringValue": "1550" },
      "variedad":         { "stringValue": "Bourbon" },
      "proceso":          { "stringValue": "Lavado" },
      "puntajeSCA":       { "stringValue": "86+" },
      "resumen":          { "stringValue": "Productor de microlotes Bourbon Lavado en Cajamarca/Amazonas, con 300 kg en fermentación para julio 2026." },
      "historia":         { "stringValue": "Jon Sánchez ha desarrollado su finca Las Travesuras de Milán enfocándose en el proceso lavado para resaltar la claridad y acidez cítrica del Bourbon." },
      "impactoSocial":    { "stringValue": "Finca familiar que genera empleo local durante la cosecha en la región cafetalera de Amazonas." },
      "status":           { "stringValue": "aprobado" }
    }
  }' > /dev/null && echo "✅ caficultores/darlyn-sanchez-2026"

echo ""
echo "🎉 Listo. Abre la landing y verifica el catálogo."

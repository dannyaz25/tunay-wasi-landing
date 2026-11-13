#!/usr/bin/env node
/**
 * resumen-lote-ayde.js — Resumen operativo del lote Ayde Rojas (geisha-honey-aydee-2026)
 * Lee pedidos de Firestore y genera el plan de producción para Javier (VioletRoast).
 *
 * Corre: node scripts/resumen-lote-ayde.js
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'tunay-wasi' });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true, databaseId: 'default' });

const PRODUCTO_ID = 'geisha-honey-aydee-2026';
const GRIND_EN_GRANO = 'grano'; // grind key para "Grano entero"

async function resumen() {
  console.log('☕ Tunay Wasi — Resumen operativo Lote Ayde Rojas\n');
  console.log(`Producto: ${PRODUCTO_ID}\n`);

  const snap = await db.collection('pedidos').get();

  const pedidosLote = [];

  for (const docSnap of snap.docs) {
    const pedido = docSnap.data();

    // Solo pedidos con pago confirmado o en preparación
    const statusValidos = ['pago_confirmado', 'en_preparacion', 'confirmado', 'pendiente_pago'];
    if (!statusValidos.includes(pedido.status)) continue;

    // Filtrar items del lote de Ayde
    const itemsAyde = (pedido.items || []).filter(
      (item) => item.productoId === PRODUCTO_ID || item.sku?.startsWith('geisha-honey-aydee'),
    );

    if (itemsAyde.length === 0) continue;

    pedidosLote.push({
      orderId: pedido.orderId,
      status: pedido.status,
      cliente: pedido.shipping?.nombre,
      telefono: pedido.shipping?.telefono,
      departamento: pedido.shipping?.departamento,
      distrito: pedido.shipping?.distrito,
      direccion: pedido.shipping?.direccion,
      zone: pedido.shipping?.zone,
      deliverEstimate: pedido.deliverEstimate,
      items: itemsAyde,
      totalCents: pedido.totals?.totalCents,
      createdAt: pedido.createdAt,
    });
  }

  if (pedidosLote.length === 0) {
    console.log('⚠️  No se encontraron pedidos para este lote.\n');
    console.log('   Verifica que el productoId sea correcto o que haya pedidos con status válido.');
    return;
  }

  // ── Totales ──────────────────────────────────────────────────────────────
  let totalBolsas = 0;
  let bolsasGrano = 0;
  let bolsasMolido = 0;
  const molidasPorTipo = {};
  let bolsasLima = 0;
  let bolsasProvincia = 0;

  for (const pedido of pedidosLote) {
    for (const item of pedido.items) {
      const qty = item.qty || 1;
      totalBolsas += qty;

      const grindKey = item.grind?.toLowerCase() || '';
      if (grindKey === GRIND_EN_GRANO || grindKey.includes('grano')) {
        bolsasGrano += qty;
      } else {
        bolsasMolido += qty;
        molidasPorTipo[item.grind] = (molidasPorTipo[item.grind] || 0) + qty;
      }

      if (pedido.zone === 'lima' || pedido.zone === 'limaExt' || pedido.zone === 'recojo') {
        bolsasLima += qty;
      } else {
        bolsasProvincia += qty;
      }
    }
  }

  // ── Costos operativos (sin IGV) ──────────────────────────────────────────
  const RENDIMIENTO = 0.78;
  const KG_VERDE = 24;
  const kgTostado = KG_VERDE * RENDIMIENTO; // ~18.72 kg

  const costoTueste = 134;       // 2 batches × S/67
  const costoAnalisis = 120;     // catación Javier
  const costoEmbolsado = totalBolsas * 1.0;
  const costoMolienda = bolsasMolido * 0.25 * 4; // ~250g = 0.25kg × S/4/kg
  const costoFlete = 295;        // Olva Jaén → Lima
  const costoBolsas = totalBolsas * 0.94; // Elixir + válvula (estimado)
  const totalCostos = costoTueste + costoAnalisis + costoEmbolsado + costoMolienda + costoFlete + costoBolsas;

  // ── Output ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('  PLAN DE PRODUCCIÓN — PARA JAVIER (VioletRoast)');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`📦 TOTAL BOLSAS A PREPARAR: ${totalBolsas}`);
  console.log(`   └─ En grano:  ${bolsasGrano} bolsas`);
  console.log(`   └─ Molido:    ${bolsasMolido} bolsas`);

  if (bolsasMolido > 0) {
    console.log('\n   Detalle molido:');
    for (const [tipo, qty] of Object.entries(molidasPorTipo)) {
      console.log(`      • ${tipo}: ${qty} bolsas`);
    }
  }

  console.log(`\n🚚 DESPACHO POR ZONA:`);
  console.log(`   └─ Lima:      ${bolsasLima} bolsas`);
  console.log(`   └─ Provincia: ${bolsasProvincia} bolsas`);

  console.log(`\n☕ PRODUCCIÓN:`);
  console.log(`   Café verde:  ${KG_VERDE} kg`);
  console.log(`   Café tostado estimado: ${kgTostado.toFixed(2)} kg (rendimiento ${RENDIMIENTO * 100}%)`);
  console.log(`   Bolsas max posibles:   ${Math.floor((kgTostado * 1000) / 250)} bolsas de 250g`);

  console.log(`\n💰 COSTOS OPERATIVOS (sin IGV):`);
  console.log(`   Análisis sensorial:  S/ ${costoAnalisis.toFixed(2)}`);
  console.log(`   Tueste (2 batches):  S/ ${costoTueste.toFixed(2)}`);
  console.log(`   Embolsado (S/1/u):   S/ ${costoEmbolsado.toFixed(2)}`);
  console.log(`   Molienda (S/4/kg):   S/ ${costoMolienda.toFixed(2)} (estimado)`);
  console.log(`   Flete Jaén→Lima:     S/ ${costoFlete.toFixed(2)}`);
  console.log(`   Bolsas (~S/0.94/u):  S/ ${costoBolsas.toFixed(2)} (estimado)`);
  console.log(`   ─────────────────────────────`);
  console.log(`   TOTAL PROCESO:       S/ ${totalCostos.toFixed(2)}`);

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  DETALLE DE PEDIDOS (${pedidosLote.length} órdenes)`);
  console.log(`═══════════════════════════════════════════════════\n`);

  for (const pedido of pedidosLote) {
    console.log(`  ${pedido.orderId} [${pedido.status}]`);
    console.log(`  Cliente: ${pedido.cliente} · ${pedido.telefono}`);
    console.log(`  Zona: ${pedido.zone} — ${pedido.departamento}, ${pedido.distrito}`);
    console.log(`  Entrega estimada: ${pedido.deliverEstimate}`);
    for (const item of pedido.items) {
      console.log(`  └─ ${item.qty}x ${item.weight} · ${item.grind}`);
    }
    console.log();
  }

  console.log('✅ Listo. Comparte este resumen con Javier antes de llevar el lote.');
}

resumen().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});

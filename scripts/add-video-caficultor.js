#!/usr/bin/env node
/**
 * add-video-caficultor.js — Agrega videoUrl al doc de Darlyn Sánchez en Firestore.
 *
 * Target: alpaso-app (QA) — NUNCA correr contra tunay-wasi (prod) sin revisión previa.
 * Corre: node scripts/add-video-caficultor.js
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'alpaso-app' });
const db = getFirestore();

const DOC_ID = '5da5ba6d-8575-4d82-a007-db0a59e219cd';
const VIDEO_URL = 'https://videos.pexels.com/video-files/26781179/12006339_960_540_25fps.mp4';

async function run() {
  const ref = db.collection('caficultores').doc(DOC_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error('Doc no encontrado:', DOC_ID);
    process.exit(1);
  }
  const data = snap.data();
  console.log('Doc encontrado:', data.nombreProductor, '— status:', data.status);
  await ref.update({ videoUrl: VIDEO_URL });
  console.log('✓ videoUrl actualizado en alpaso-app/caficultores/' + DOC_ID);
}

run().catch(e => { console.error(e); process.exit(1); });

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLoteAprobadoPorCertificacion = exports.onSolicitudCertificacionCreada = exports.asistenteCatacion = exports.liberarReservasExpiradas = exports.onPedidoPagoVerificado = exports.onPedidoCreated = exports.izipayWebhook = exports.metaCapi = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const node_fetch_1 = require("node-fetch");
const crypto = require("crypto");
const sdk_1 = require("@anthropic-ai/sdk");
const nodemailer = require("nodemailer");
admin.initializeApp();
const db = admin.firestore();
const PIXEL_ID = "992445397287279";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
// ── Helpers ───────────────────────────────────────────────────────────────────
function hashData(value) {
    return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}
function getMailTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "tunaywasi@gmail.com",
            pass: process.env.GMAIL_APP_PASSWORD || "",
        },
    });
}
async function sendEmail(to, subject, html) {
    try {
        const transporter = getMailTransporter();
        await transporter.sendMail({
            from: '"Tunay Wasi" <tunaywasi@gmail.com>',
            to,
            subject,
            html,
        });
    }
    catch (err) {
        functions.logger.error("Email error", { to, subject, err });
    }
}
async function getAnthropicClient() {
    return new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
}
async function sendPush(uid, title, body, data = {}) {
    var _a, _b;
    try {
        const userSnap = await db.collection("usuarios_perfil").doc(uid).get();
        const fcmToken = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
        if (!fcmToken) {
            functions.logger.info("Push: no fcmToken para", uid);
            return;
        }
        functions.logger.info("Push: enviando a", { uid, title, token: fcmToken.slice(0, 20) + "..." });
        await admin.messaging().send({
            token: fcmToken,
            notification: { title, body },
            data,
            webpush: {
                notification: { icon: "https://tunay-wasi.web.app/imgs/logo.png" },
                fcmOptions: { link: (_b = data.url) !== null && _b !== void 0 ? _b : "https://tunay-wasi.web.app" },
            },
        });
        functions.logger.info("Push: enviado OK a", uid);
    }
    catch (err) {
        functions.logger.warn("Push error", { uid, err });
    }
}
// ── 1. META CAPI ──────────────────────────────────────────────────────────────
exports.metaCapi = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    const { event_name, event_time, user_data, custom_data, event_source_url } = req.body;
    if (!event_name) {
        res.status(400).json({ error: "event_name requerido" });
        return;
    }
    const payload = {
        data: [
            Object.assign({ event_name, event_time: event_time || Math.floor(Date.now() / 1000), event_source_url: event_source_url || "https://tunay-wasi.web.app", action_source: "website", user_data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, ((user_data === null || user_data === void 0 ? void 0 : user_data.em) && { em: [hashData(user_data.em)] })), ((user_data === null || user_data === void 0 ? void 0 : user_data.ph) && { ph: [hashData(user_data.ph)] })), ((user_data === null || user_data === void 0 ? void 0 : user_data.client_ip_address) && { client_ip_address: user_data.client_ip_address })), ((user_data === null || user_data === void 0 ? void 0 : user_data.client_user_agent) && { client_user_agent: user_data.client_user_agent })), ((user_data === null || user_data === void 0 ? void 0 : user_data.fbp) && { fbp: user_data.fbp })), ((user_data === null || user_data === void 0 ? void 0 : user_data.fbc) && { fbc: user_data.fbc })) }, (custom_data && { custom_data })),
        ],
    };
    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const response = await (0, node_fetch_1.default)(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    res.status(response.ok ? 200 : 400).json(result);
});
// ── 2. IZIPAY WEBHOOK ─────────────────────────────────────────────────────────
exports.izipayWebhook = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
    var _a, _b;
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }
    // Validar firma HMAC-SHA256
    const webhookSecret = process.env.IZIPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-izipay-signature"];
    const rawBody = JSON.stringify(req.body);
    const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
    if (signature !== expectedSig) {
        functions.logger.warn("izipayWebhook: firma inválida", { signature });
        res.status(401).send("Unauthorized");
        return;
    }
    const { orderStatus, orderId, amount, currency } = req.body;
    if (orderStatus !== "PAID") {
        res.status(200).json({ received: true, action: "ignored", orderStatus });
        return;
    }
    const snap = await db
        .collection("mkt_pedidos")
        .where("izipayOrderId", "==", orderId)
        .limit(1)
        .get();
    if (snap.empty) {
        functions.logger.error("izipayWebhook: pedido no encontrado", { orderId });
        res.status(404).json({ error: "Pedido no encontrado" });
        return;
    }
    const pedidoDoc = snap.docs[0];
    const pedido = pedidoDoc.data();
    // Verificar monto (tolerancia ±1 centavo)
    const montoEsperado = Math.round(pedido.totalPEN * 100);
    const montoRecibido = Math.round(parseFloat(amount) * 100);
    if (Math.abs(montoEsperado - montoRecibido) > 1) {
        await pedidoDoc.ref.update({ fraudFlag: true, fraudScore: 9 });
        const adminEmail = process.env.ADMIN_EMAIL || "tunaywasi@gmail.com";
        await sendEmail(adminEmail, "⚠️ Tunay Wasi — Alerta: monto no coincide", `<p>Pedido <strong>${pedidoDoc.id}</strong> tiene discrepancia de monto.</p>
         <p>Esperado: S/ ${pedido.totalPEN} — Recibido: S/ ${amount}</p>
         <p>Empresa: ${pedido.razonSocial} | RUC: ${pedido.ruc}</p>`);
        res.status(200).json({ received: true, action: "flagged_amount_mismatch" });
        return;
    }
    // Analizar fraude con Claude
    const anthropic = await getAnthropicClient();
    let fraudScore = 0;
    let fraudMotivo = "";
    try {
        const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 128,
            messages: [
                {
                    role: "user",
                    content: `Analiza este pedido B2B de café verde y devuelve SOLO un JSON con "score" (0-10, donde 10 = máximo riesgo) y "motivo" (string breve).

Pedido:
- RUC: ${pedido.ruc}
- Monto total: S/ ${pedido.totalPEN}
- Sacos: ${pedido.sacosSolicitados}
- Email: ${pedido.email}
- Dirección: ${pedido.direccionEntrega}
- Empresa: ${pedido.razonSocial}
- Moneda webhook: ${currency}

Reglas:
1. RUC peruano debe tener exactamente 11 dígitos
2. Pedidos > 50 sacos sin historial son sospechosos
3. Moneda diferente a PEN es anómala

Responde SOLO JSON: {"score": <número>, "motivo": "<string>"}`,
                },
            ],
        });
        const rawText = message.content[0].text.trim();
        const parsed = JSON.parse(rawText);
        fraudScore = (_a = parsed.score) !== null && _a !== void 0 ? _a : 0;
        fraudMotivo = (_b = parsed.motivo) !== null && _b !== void 0 ? _b : "";
        await pedidoDoc.ref.update(Object.assign({ fraudScore, fraudFlag: fraudScore > 7 }, (fraudMotivo && { fraudMotivo })));
        if (fraudScore > 7) {
            const adminEmail = process.env.ADMIN_EMAIL || "tunaywasi@gmail.com";
            await sendEmail(adminEmail, "⚠️ Tunay Wasi — Alerta de fraude", `<p>Pedido <strong>${pedidoDoc.id}</strong> tiene score de fraude alto: <strong>${fraudScore}/10</strong></p>
           <p>Motivo: ${fraudMotivo}</p>
           <p>Empresa: ${pedido.razonSocial} | RUC: ${pedido.ruc} | Monto: S/ ${pedido.totalPEN}</p>
           <p>Revisar en el panel admin antes de procesar.</p>`);
            res.status(200).json({ received: true, action: "flagged_fraud", fraudScore });
            return;
        }
    }
    catch (err) {
        functions.logger.error("izipayWebhook: error Claude", { err });
    }
    // Verificar pago automáticamente
    await pedidoDoc.ref.update({
        pagoStatus: "verificado",
        logisticaStatus: "en_origen",
        updatedAt: new Date().toISOString(),
    });
    functions.logger.info("izipayWebhook: pago verificado automáticamente", {
        pedidoId: pedidoDoc.id,
        fraudScore,
    });
    res.status(200).json({ received: true, action: "verified", pedidoId: pedidoDoc.id });
});
// ── 3. ON PEDIDO CREATED — notifica al caficultor ─────────────────────────────
exports.onPedidoCreated = functions
    .region("us-central1")
    .firestore.document("mkt_pedidos/{pedidoId}")
    .onCreate(async (snap) => {
    const pedido = snap.data();
    if (!pedido)
        return;
    const caficultorSnap = await db.collection("usuarios_perfil").doc(pedido.caficultorId).get();
    const caficultor = caficultorSnap.data();
    if (!(caficultor === null || caficultor === void 0 ? void 0 : caficultor.email))
        return;
    await sendEmail(caficultor.email, "☕ Tunay Wasi — Nuevo pedido recibido", `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1f3028">Tienes un nuevo pedido</h2>
        <p>La cafetería <strong>${pedido.razonSocial}</strong> reservó <strong>${pedido.sacosSolicitados} sacos</strong> de tu lote <strong>${pedido.loteId}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Sacos</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${pedido.sacosSolicitados}</strong></td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Lo que recibirás</td><td style="padding:8px;border-bottom:1px solid #eee"><strong style="color:#c96e4b">S/ ${pedido.montoCaficultorPEN}</strong></td></tr>
          <tr><td style="padding:8px;color:#888">Comprador</td><td style="padding:8px">${pedido.razonSocial}</td></tr>
        </table>
        <p style="color:#888;font-size:13px">El pago está siendo verificado. Cuando se confirme, recibirás otro email para coordinar el despacho.</p>
        <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver en mi portal →</a>
      </div>`);
    // Push notification al caficultor
    await sendPush(pedido.caficultorId, "☕ Nuevo pedido recibido", `${pedido.razonSocial} reservó ${pedido.sacosSolicitados} sacos — S/ ${pedido.montoCaficultorPEN} para ti`, { url: "https://tunay-wasi.web.app" });
});
// ── 4. ON PEDIDO PAGO VERIFICADO — notifica a cafetería y caficultor ──────────
exports.onPedidoPagoVerificado = functions
    .region("us-central1")
    .firestore.document("mkt_pedidos/{pedidoId}")
    .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.pagoStatus === after.pagoStatus)
        return;
    if (after.pagoStatus !== "verificado")
        return;
    // Email a la cafetería
    await sendEmail(after.email, "✅ Tunay Wasi — Pago confirmado", `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1f3028">Tu pago fue confirmado</h2>
        <p>Pedido <strong>${change.after.id}</strong> — Lote <strong>${after.loteId}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Sacos</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${after.sacosSolicitados}</strong></td></tr>
          <tr><td style="padding:8px;color:#888">Total pagado</td><td style="padding:8px"><strong style="color:#c96e4b">S/ ${after.totalPEN}</strong></td></tr>
        </table>
        <p style="color:#888;font-size:13px">El caficultor coordinará el despacho en breve. Te notificaremos cuando el café esté en camino.</p>
        <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver mis pedidos →</a>
      </div>`);
    // Push a la cafetería
    await sendPush(after.tostadoraId, "✅ Pago confirmado", `Tu pedido de ${after.sacosSolicitados} sacos está en preparación`, { url: "https://tunay-wasi.web.app" });
    // Email al caficultor
    const caficultorSnap = await db.collection("usuarios_perfil").doc(after.caficultorId).get();
    const caficultor = caficultorSnap.data();
    if (caficultor === null || caficultor === void 0 ? void 0 : caficultor.email) {
        await sendEmail(caficultor.email, "💰 Tunay Wasi — Pago verificado, listo para despachar", `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#1f3028">El pago fue verificado</h2>
          <p>El pedido de <strong>${after.razonSocial}</strong> está confirmado.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Sacos a despachar</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${after.sacosSolicitados}</strong></td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Dirección de entrega</td><td style="padding:8px;border-bottom:1px solid #eee">${after.direccionEntrega}</td></tr>
            <tr><td style="padding:8px;color:#888">Tu pago</td><td style="padding:8px"><strong style="color:#c96e4b">S/ ${after.montoCaficultorPEN}</strong></td></tr>
          </table>
          <p style="color:#888;font-size:13px">Ingresa a tu portal, ve a "Mis lotes" e ingresa los datos de envío (empresa transportista + número de guía).</p>
          <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ingresar datos de envío →</a>
        </div>`);
    }
});
// ── 5. LIBERAR RESERVAS EXPIRADAS — cron cada hora ───────────────────────────
exports.liberarReservasExpiradas = functions
    .region("us-central1")
    .pubsub.schedule("every 60 minutes")
    .onRun(async () => {
    const ahora = new Date().toISOString();
    const snap = await db
        .collection("mkt_pedidos")
        .where("pagoStatus", "==", "pendiente")
        .where("reservaExpiraAt", "<", ahora)
        .get();
    if (snap.empty) {
        functions.logger.info("liberarReservasExpiradas: sin reservas vencidas");
        return;
    }
    const batch = db.batch();
    for (const doc of snap.docs) {
        const pedido = doc.data();
        // Devolver sacos al lote
        const loteRef = db.collection("mkt_lotes").doc(pedido.loteId);
        const loteSnap = await loteRef.get();
        if (loteSnap.exists) {
            const lote = loteSnap.data();
            batch.update(loteRef, {
                sacosReservados: Math.max(0, (lote.sacosReservados || 0) - pedido.sacosSolicitados),
                updatedAt: ahora,
            });
        }
        // Cancelar pedido
        batch.update(doc.ref, {
            pagoStatus: "rechazado",
            logisticaStatus: "cancelado",
            updatedAt: ahora,
        });
        // Notificar a la cafetería
        await sendEmail(pedido.email, "⏰ Tunay Wasi — Tu reserva venció", `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#1f3028">Tu reserva venció</h2>
          <p>La reserva del pedido <strong>${doc.id}</strong> — <strong>${pedido.sacosSolicitados} sacos</strong> del lote <strong>${pedido.loteId}</strong> venció sin pago confirmado.</p>
          <p style="color:#888;font-size:13px">Los sacos vuelven al catálogo. Si aún quieres comprarlos, vuelve a realizar el pedido.</p>
          <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver catálogo →</a>
        </div>`);
        functions.logger.info("liberarReservasExpiradas: liberado", {
            pedidoId: doc.id,
            loteId: pedido.loteId,
            sacos: pedido.sacosSolicitados,
        });
    }
    await batch.commit();
    functions.logger.info(`liberarReservasExpiradas: ${snap.size} reservas liberadas`);
});
// ── 6. ASISTENTE DE CATACIÓN — Claude haiku ───────────────────────────────────
exports.asistenteCatacion = functions
    .region("us-central1")
    .https.onCall(async (data) => {
    const { notasLibres, loteInfo } = data;
    if (!notasLibres || typeof notasLibres !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Se requiere el campo notasLibres");
    }
    const anthropic = await getAnthropicClient();
    const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [
            {
                role: "user",
                content: `Eres un Q-Grader SCA. Convierte estas notas de catación en campos estructurados.

${loteInfo ? `Lote: ${loteInfo}` : ""}
Notas del catador: "${notasLibres}"

Devuelve SOLO un JSON (sin texto adicional):
{
  "acidez": <1-10>,
  "cuerpo": <1-10>,
  "balance": <1-10>,
  "notasSabor": [<array de strings, max 5, en español>],
  "perfilTueste": <"Claro" | "Medio" | "Medio oscuro" | "Oscuro">,
  "puntajeSugerido": <80-100 o null>
}`,
            },
        ],
    });
    const rawText = message.content[0].text.trim();
    const parsed = JSON.parse(rawText);
    return { ok: true, campos: parsed };
});
// ── 7. NOTIFICACIÓN AL LAB — Solicitud de certificación por caficultor ─────────
exports.onSolicitudCertificacionCreada = functions
    .region("us-central1")
    .firestore.document("mkt_solicitudes_certificacion/{solicitudId}")
    .onCreate(async (snap) => {
    var _a, _b, _c;
    const sol = snap.data();
    if (!sol)
        return;
    // Obtener datos del laboratorio
    const labSnap = await db.doc(`mkt_laboratorios/${sol.laboratorioId}`).get();
    if (!labSnap.exists)
        return;
    const lab = labSnap.data();
    // Obtener datos del lote
    const loteSnap = await db.doc(`mkt_lotes/${sol.loteId}`).get();
    const lote = loteSnap.exists ? loteSnap.data() : null;
    // Obtener perfil del caficultor
    const caficultorSnap = await db.doc(`usuarios_perfil/${sol.caficultorId}`).get();
    const caficultor = caficultorSnap.exists ? caficultorSnap.data() : null;
    if (!lab.email)
        return;
    await sendEmail(lab.email, `Nueva solicitud de certificación — ${sol.nombreLote}`, `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f3028;">Nueva solicitud de certificación SCA</h2>
        <p>El caficultor <strong>${(_a = caficultor === null || caficultor === void 0 ? void 0 : caficultor.nombre) !== null && _a !== void 0 ? _a : sol.caficultorId}</strong> ha solicitado que certifiques su lote.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Lote</td><td style="padding: 8px; border: 1px solid #e8e2da;">${sol.nombreLote}</td></tr>
          ${lote ? `
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Variedad</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.variedad}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Proceso</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.proceso}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Altitud</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.altitud}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Región</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.region}</td></tr>
          ` : ""}
          ${caficultor ? `<tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Contacto caficultor</td><td style="padding: 8px; border: 1px solid #e8e2da;">${(_b = caficultor.telefono) !== null && _b !== void 0 ? _b : "—"}</td></tr>` : ""}
        </table>
        <p style="color: #c96e4b;"><strong>Acción requerida:</strong> El caficultor coordinará contigo el envío de la muestra de 200g y el pago del fee de catación (S/ ${(_c = lab.feeCatacionPEN) !== null && _c !== void 0 ? _c : "—"}).</p>
        <p style="color: #8faf8a;">Ingresa a tu portal de laboratorio para ver el lote asignado.</p>
        <hr style="border: none; border-top: 1px solid #e8e2da; margin: 24px 0;" />
        <p style="color: #c4b297; font-size: 12px;">Tunay Wasi — Plataforma B2B de café de especialidad</p>
      </div>
      `);
});
// ── 8. NOTIFICACIÓN AL CAFICULTOR — Lote aprobado/rechazado por certificación ─
exports.onLoteAprobadoPorCertificacion = functions
    .region("us-central1")
    .firestore.document("mkt_lotes/{loteId}")
    .onUpdate(async (change) => {
    var _a, _b;
    const before = change.before.data();
    const after = change.after.data();
    // Solo actuar cuando cambia de estado no-aprobado a aprobado
    // y el lote fue certificado por el caficultor
    if (!after.certificadoPorCaficultor)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== "aprobado" && after.status !== "rechazado")
        return;
    // Publicar automáticamente si fue aprobado
    if (after.status === "aprobado") {
        await change.after.ref.update({
            status: "publicado",
            publicadoAt: new Date().toISOString(),
        });
    }
    // Notificar al caficultor
    const caficultorSnap = await db.doc(`usuarios_perfil/${after.caficultorId}`).get();
    if (!caficultorSnap.exists)
        return;
    const caficultor = caficultorSnap.data();
    if (!caficultor.email)
        return;
    const aprobado = after.status === "aprobado";
    await sendEmail(caficultor.email, aprobado
        ? `✅ Tu lote fue aprobado con ${after.puntajeOficial} pts SCA — ${after.nombreLote}`
        : `❌ Tu lote no alcanzó el puntaje mínimo — ${after.nombreLote}`, `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${aprobado ? "#8faf8a" : "#e06060"};">
          ${aprobado ? "✅ ¡Tu lote fue aprobado!" : "❌ Lote no alcanzó el puntaje mínimo"}
        </h2>
        <p>El laboratorio ha registrado el resultado de la catación de tu lote <strong>${after.nombreLote}</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Puntaje SCA oficial</td><td style="padding: 8px; border: 1px solid #e8e2da; font-size: 20px; color: #c96e4b;"><strong>${(_a = after.puntajeOficial) !== null && _a !== void 0 ? _a : "—"} pts</strong></td></tr>
          ${((_b = after.notasSabor) === null || _b === void 0 ? void 0 : _b.length) ? `<tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Notas de sabor</td><td style="padding: 8px; border: 1px solid #e8e2da;">${after.notasSabor.join(", ")}</td></tr>` : ""}
          ${after.datosTueste ? `<tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Perfil de tueste</td><td style="padding: 8px; border: 1px solid #e8e2da;">${after.datosTueste}</td></tr>` : ""}
        </table>
        ${aprobado
        ? `<p style="color: #8faf8a;"><strong>Tu lote ya está publicado en el marketplace</strong> con el badge "✓ SCA ${after.puntajeOficial} pts". Las cafeterías podrán comprarlo directamente.</p>`
        : `<p style="color: #e06060;">El puntaje mínimo es 80 pts. Puedes coordinar una nueva catación con otro laboratorio desde tu portal.</p>`}
        <hr style="border: none; border-top: 1px solid #e8e2da; margin: 24px 0;" />
        <p style="color: #c4b297; font-size: 12px;">Tunay Wasi — Plataforma B2B de café de especialidad</p>
      </div>
      `);
});
//# sourceMappingURL=index.js.map
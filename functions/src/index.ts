import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import * as crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

const PIXEL_ID = "992445397287279";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashData(value: string): string {
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

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const transporter = getMailTransporter();
    await transporter.sendMail({
      from: '"Tunay Wasi" <tunaywasi@gmail.com>',
      to,
      subject,
      html,
    });
  } catch (err) {
    functions.logger.error("Email error", { to, subject, err });
  }
}

async function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
}

async function sendPush(uid: string, title: string, body: string, data: Record<string, string> = {}): Promise<void> {
  try {
    const userSnap = await db.collection("usuarios_perfil").doc(uid).get();
    const fcmToken = userSnap.data()?.fcmToken as string | undefined;
    if (!fcmToken) { functions.logger.info("Push: no fcmToken para", uid); return; }
    functions.logger.info("Push: enviando a", { uid, title, token: fcmToken.slice(0, 20) + "..." });
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      webpush: {
        notification: { icon: "https://tunay-wasi.web.app/imgs/logo.png" },
        fcmOptions: { link: data.url ?? "https://tunay-wasi.web.app" },
      },
    });
    functions.logger.info("Push: enviado OK a", uid);
  } catch (err) {
    functions.logger.warn("Push error", { uid, err });
  }
}

// ── 1. META CAPI ──────────────────────────────────────────────────────────────

export const metaCapi = functions
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
        {
          event_name,
          event_time: event_time || Math.floor(Date.now() / 1000),
          event_source_url: event_source_url || "https://tunay-wasi.web.app",
          action_source: "website",
          user_data: {
            ...(user_data?.em && { em: [hashData(user_data.em)] }),
            ...(user_data?.ph && { ph: [hashData(user_data.ph)] }),
            ...(user_data?.client_ip_address && { client_ip_address: user_data.client_ip_address }),
            ...(user_data?.client_user_agent && { client_user_agent: user_data.client_user_agent }),
            ...(user_data?.fbp && { fbp: user_data.fbp }),
            ...(user_data?.fbc && { fbc: user_data.fbc }),
          },
          ...(custom_data && { custom_data }),
        },
      ],
    };

    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    res.status(response.ok ? 200 : 400).json(result);
  });

// ── 2. IZIPAY WEBHOOK ─────────────────────────────────────────────────────────

export const izipayWebhook = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    // Validar firma HMAC-SHA256
    const webhookSecret = process.env.IZIPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-izipay-signature"] as string;
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
      await sendEmail(
        adminEmail,
        "⚠️ Tunay Wasi — Alerta: monto no coincide",
        `<p>Pedido <strong>${pedidoDoc.id}</strong> tiene discrepancia de monto.</p>
         <p>Esperado: S/ ${pedido.totalPEN} — Recibido: S/ ${amount}</p>
         <p>Empresa: ${pedido.razonSocial} | RUC: ${pedido.ruc}</p>`
      );
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

      const rawText = (message.content[0] as { type: string; text: string }).text.trim();
      const parsed = JSON.parse(rawText);
      fraudScore = parsed.score ?? 0;
      fraudMotivo = parsed.motivo ?? "";

      await pedidoDoc.ref.update({
        fraudScore,
        fraudFlag: fraudScore > 7,
        ...(fraudMotivo && { fraudMotivo }),
      });

      if (fraudScore > 7) {
        const adminEmail = process.env.ADMIN_EMAIL || "tunaywasi@gmail.com";
        await sendEmail(
          adminEmail,
          "⚠️ Tunay Wasi — Alerta de fraude",
          `<p>Pedido <strong>${pedidoDoc.id}</strong> tiene score de fraude alto: <strong>${fraudScore}/10</strong></p>
           <p>Motivo: ${fraudMotivo}</p>
           <p>Empresa: ${pedido.razonSocial} | RUC: ${pedido.ruc} | Monto: S/ ${pedido.totalPEN}</p>
           <p>Revisar en el panel admin antes de procesar.</p>`
        );
        res.status(200).json({ received: true, action: "flagged_fraud", fraudScore });
        return;
      }
    } catch (err) {
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

export const onPedidoCreated = functions
  .region("us-central1")
  .firestore.document("mkt_pedidos/{pedidoId}")
  .onCreate(async (snap) => {
    const pedido = snap.data();
    if (!pedido) return;

    const caficultorSnap = await db.collection("usuarios_perfil").doc(pedido.caficultorId).get();
    const caficultor = caficultorSnap.data();
    if (!caficultor?.email) return;

    await sendEmail(
      caficultor.email,
      "☕ Tunay Wasi — Nuevo pedido recibido",
      `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1f3028">Tienes un nuevo pedido</h2>
        <p>La cafetería <strong>${pedido.razonSocial}</strong> reservó <strong>${pedido.sacosSolicitados} sacos</strong> de tu lote <strong>${pedido.loteId}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Sacos</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${pedido.sacosSolicitados}</strong></td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Lo que recibirás</td><td style="padding:8px;border-bottom:1px solid #eee"><strong style="color:#c96e4b">S/ ${pedido.montoCaficultorPEN}</strong></td></tr>
          <tr><td style="padding:8px;color:#888">Comprador</td><td style="padding:8px">${pedido.razonSocial}</td></tr>
        </table>
        <p style="color:#888;font-size:13px">El pago está siendo verificado. Cuando se confirme, recibirás otro email para coordinar el despacho.</p>
        <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver en mi portal →</a>
      </div>`
    );

    // Push notification al caficultor
    await sendPush(
      pedido.caficultorId,
      "☕ Nuevo pedido recibido",
      `${pedido.razonSocial} reservó ${pedido.sacosSolicitados} sacos — S/ ${pedido.montoCaficultorPEN} para ti`,
      { url: "https://tunay-wasi.web.app" }
    );
  });

// ── 4. ON PEDIDO PAGO VERIFICADO — notifica a cafetería y caficultor ──────────

export const onPedidoPagoVerificado = functions
  .region("us-central1")
  .firestore.document("mkt_pedidos/{pedidoId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.pagoStatus === after.pagoStatus) return;
    if (after.pagoStatus !== "verificado") return;

    // Email a la cafetería
    await sendEmail(
      after.email,
      "✅ Tunay Wasi — Pago confirmado",
      `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1f3028">Tu pago fue confirmado</h2>
        <p>Pedido <strong>${change.after.id}</strong> — Lote <strong>${after.loteId}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Sacos</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${after.sacosSolicitados}</strong></td></tr>
          <tr><td style="padding:8px;color:#888">Total pagado</td><td style="padding:8px"><strong style="color:#c96e4b">S/ ${after.totalPEN}</strong></td></tr>
        </table>
        <p style="color:#888;font-size:13px">El caficultor coordinará el despacho en breve. Te notificaremos cuando el café esté en camino.</p>
        <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver mis pedidos →</a>
      </div>`
    );

    // Push a la cafetería
    await sendPush(
      after.tostadoraId,
      "✅ Pago confirmado",
      `Tu pedido de ${after.sacosSolicitados} sacos está en preparación`,
      { url: "https://tunay-wasi.web.app" }
    );

    // Email al caficultor
    const caficultorSnap = await db.collection("usuarios_perfil").doc(after.caficultorId).get();
    const caficultor = caficultorSnap.data();
    if (caficultor?.email) {
      await sendEmail(
        caficultor.email,
        "💰 Tunay Wasi — Pago verificado, listo para despachar",
        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#1f3028">El pago fue verificado</h2>
          <p>El pedido de <strong>${after.razonSocial}</strong> está confirmado.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Sacos a despachar</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${after.sacosSolicitados}</strong></td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888">Dirección de entrega</td><td style="padding:8px;border-bottom:1px solid #eee">${after.direccionEntrega}</td></tr>
            <tr><td style="padding:8px;color:#888">Tu pago</td><td style="padding:8px"><strong style="color:#c96e4b">S/ ${after.montoCaficultorPEN}</strong></td></tr>
          </table>
          <p style="color:#888;font-size:13px">Ingresa a tu portal, ve a "Mis lotes" e ingresa los datos de envío (empresa transportista + número de guía).</p>
          <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ingresar datos de envío →</a>
        </div>`
      );
    }
  });

// ── 5. LIBERAR RESERVAS EXPIRADAS — cron cada hora ───────────────────────────

export const liberarReservasExpiradas = functions
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
        const lote = loteSnap.data()!;
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
      await sendEmail(
        pedido.email,
        "⏰ Tunay Wasi — Tu reserva venció",
        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#1f3028">Tu reserva venció</h2>
          <p>La reserva del pedido <strong>${doc.id}</strong> — <strong>${pedido.sacosSolicitados} sacos</strong> del lote <strong>${pedido.loteId}</strong> venció sin pago confirmado.</p>
          <p style="color:#888;font-size:13px">Los sacos vuelven al catálogo. Si aún quieres comprarlos, vuelve a realizar el pedido.</p>
          <a href="https://tunay-wasi.web.app" style="display:inline-block;background:#c96e4b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver catálogo →</a>
        </div>`
      );

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

export const asistenteCatacion = functions
  .region("us-central1")
  .https.onCall(async (data) => {
    const { notasLibres, loteInfo } = data;

    if (!notasLibres || typeof notasLibres !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Se requiere el campo notasLibres"
      );
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

    const rawText = (message.content[0] as { type: string; text: string }).text.trim();
    const parsed = JSON.parse(rawText);
    return { ok: true, campos: parsed };
  });

// ── 7. NOTIFICACIÓN AL LAB — Solicitud de certificación por caficultor ─────────

export const onSolicitudCertificacionCreada = functions
  .region("us-central1")
  .firestore.document("mkt_solicitudes_certificacion/{solicitudId}")
  .onCreate(async (snap) => {
    const sol = snap.data();
    if (!sol) return;

    // Obtener datos del laboratorio
    const labSnap = await db.doc(`mkt_laboratorios/${sol.laboratorioId}`).get();
    if (!labSnap.exists) return;
    const lab = labSnap.data()!;

    // Obtener datos del lote
    const loteSnap = await db.doc(`mkt_lotes/${sol.loteId}`).get();
    const lote = loteSnap.exists ? loteSnap.data()! : null;

    // Obtener perfil del caficultor
    const caficultorSnap = await db.doc(`usuarios_perfil/${sol.caficultorId}`).get();
    const caficultor = caficultorSnap.exists ? caficultorSnap.data()! : null;

    if (!lab.email) return;

    await sendEmail(
      lab.email,
      `Nueva solicitud de certificación — ${sol.nombreLote}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f3028;">Nueva solicitud de certificación SCA</h2>
        <p>El caficultor <strong>${caficultor?.nombre ?? sol.caficultorId}</strong> ha solicitado que certifiques su lote.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Lote</td><td style="padding: 8px; border: 1px solid #e8e2da;">${sol.nombreLote}</td></tr>
          ${lote ? `
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Variedad</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.variedad}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Proceso</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.proceso}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Altitud</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.altitud}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Región</td><td style="padding: 8px; border: 1px solid #e8e2da;">${lote.region}</td></tr>
          ` : ""}
          ${caficultor ? `<tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Contacto caficultor</td><td style="padding: 8px; border: 1px solid #e8e2da;">${caficultor.telefono ?? "—"}</td></tr>` : ""}
        </table>
        <p style="color: #c96e4b;"><strong>Acción requerida:</strong> El caficultor coordinará contigo el envío de la muestra de 200g y el pago del fee de catación (S/ ${lab.feeCatacionPEN ?? "—"}).</p>
        <p style="color: #8faf8a;">Ingresa a tu portal de laboratorio para ver el lote asignado.</p>
        <hr style="border: none; border-top: 1px solid #e8e2da; margin: 24px 0;" />
        <p style="color: #c4b297; font-size: 12px;">Tunay Wasi — Plataforma B2B de café de especialidad</p>
      </div>
      `
    );
  });

// ── 8. NOTIFICACIÓN AL CAFICULTOR — Lote aprobado/rechazado por certificación ─

export const onLoteAprobadoPorCertificacion = functions
  .region("us-central1")
  .firestore.document("mkt_lotes/{loteId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    // Solo actuar cuando cambia de estado no-aprobado a aprobado
    // y el lote fue certificado por el caficultor
    if (!after.certificadoPorCaficultor) return;
    if (before.status === after.status) return;
    if (after.status !== "aprobado" && after.status !== "rechazado") return;

    // Publicar automáticamente si fue aprobado
    if (after.status === "aprobado") {
      await change.after.ref.update({
        status: "publicado",
        publicadoAt: new Date().toISOString(),
      });
    }

    // Notificar al caficultor
    const caficultorSnap = await db.doc(`usuarios_perfil/${after.caficultorId}`).get();
    if (!caficultorSnap.exists) return;
    const caficultor = caficultorSnap.data()!;
    if (!caficultor.email) return;

    const aprobado = after.status === "aprobado";
    await sendEmail(
      caficultor.email,
      aprobado
        ? `✅ Tu lote fue aprobado con ${after.puntajeOficial} pts SCA — ${after.nombreLote}`
        : `❌ Tu lote no alcanzó el puntaje mínimo — ${after.nombreLote}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${aprobado ? "#8faf8a" : "#e06060"};">
          ${aprobado ? "✅ ¡Tu lote fue aprobado!" : "❌ Lote no alcanzó el puntaje mínimo"}
        </h2>
        <p>El laboratorio ha registrado el resultado de la catación de tu lote <strong>${after.nombreLote}</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Puntaje SCA oficial</td><td style="padding: 8px; border: 1px solid #e8e2da; font-size: 20px; color: #c96e4b;"><strong>${after.puntajeOficial ?? "—"} pts</strong></td></tr>
          ${after.notasSabor?.length ? `<tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Notas de sabor</td><td style="padding: 8px; border: 1px solid #e8e2da;">${after.notasSabor.join(", ")}</td></tr>` : ""}
          ${after.datosTueste ? `<tr><td style="padding: 8px; border: 1px solid #e8e2da; font-weight: bold;">Perfil de tueste</td><td style="padding: 8px; border: 1px solid #e8e2da;">${after.datosTueste}</td></tr>` : ""}
        </table>
        ${aprobado
          ? `<p style="color: #8faf8a;"><strong>Tu lote ya está publicado en el marketplace</strong> con el badge "✓ SCA ${after.puntajeOficial} pts". Las cafeterías podrán comprarlo directamente.</p>`
          : `<p style="color: #e06060;">El puntaje mínimo es 80 pts. Puedes coordinar una nueva catación con otro laboratorio desde tu portal.</p>`
        }
        <hr style="border: none; border-top: 1px solid #e8e2da; margin: 24px 0;" />
        <p style="color: #c4b297; font-size: 12px;">Tunay Wasi — Plataforma B2B de café de especialidad</p>
      </div>
      `
    );
  });

// ── 9. RECORDATORIO HUB LIMA — Caficultores con lotes publicados sin muestras ──
// Corre todos los días a las 9am hora Lima.
// Busca lotes publicados donde stockMuestrasHub === 0 y muestraEnCamino !== true.
// Envía email + notif in-app al caficultor para que envíe muestras al hub.

export const recordatorioEnvioMuestrasHub = functions
  .region("us-central1")
  .pubsub.schedule("0 9 * * *")
  .timeZone("America/Lima")
  .onRun(async () => {
    const lotesSnap = await db
      .collection("mkt_lotes")
      .where("status", "==", "publicado")
      .where("stockMuestrasHub", "==", 0)
      .get();

    if (lotesSnap.empty) return;

    for (const loteDoc of lotesSnap.docs) {
      const lote = loteDoc.data();

      // Saltar si ya hay muestras en camino declaradas por el caficultor
      if (lote.muestraEnCamino === true) continue;

      // Obtener perfil del caficultor
      const caficultorSnap = await db.doc(`usuarios_perfil/${lote.caficultorId}`).get();
      if (!caficultorSnap.exists) continue;
      const caficultor = caficultorSnap.data()!;

      // Notificación in-app
      const notifRef = db
        .collection("mkt_notificaciones")
        .doc(lote.caficultorId)
        .collection("items")
        .doc();
      await notifRef.set({
        id: notifRef.id,
        titulo: "📦 Envía muestras al hub Lima",
        cuerpo: `Tu lote "${lote.nombreLote}" está publicado pero no tiene muestras en el hub. Envía 3-5 muestras de 200g para que las cafeterías puedan pedirlas.`,
        url: "mis_lotes",
        leida: false,
        createdAt: new Date().toISOString(),
      });

      // Email
      if (!caficultor.email) continue;
      await sendEmail(
        caficultor.email,
        `📦 Tu lote "${lote.nombreLote}" necesita muestras en el hub Lima`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f3028;">📦 Envía muestras al hub Lima</h2>
          <p>Hola <strong>${caficultor.nombre ?? "caficultor"}</strong>,</p>
          <p>Tu lote <strong>${lote.nombreLote}</strong> está publicado en el marketplace pero aún no tiene muestras disponibles en el hub Lima.</p>
          <p style="background: #fdf8f2; border-left: 3px solid #c96e4b; padding: 12px 16px; border-radius: 4px;">
            Las cafeterías no pueden solicitar muestras hasta que envíes <strong>3-5 muestras de 200g</strong> al hub y Tunay Wasi confirme su recepción.
          </p>
          <h3 style="color: #533b22;">¿Cómo enviarlas?</h3>
          <ol style="color: #533b22; line-height: 1.8;">
            <li>Prepara 3-5 bolsas de 200g de tu lote <strong>${lote.nombreLote}</strong></li>
            <li>Envíalas por Shalom, Olva o Cruz del Sur a:<br/>
              <strong>Tunay Wasi — Hub Lima</strong><br/>
              Jr. Ucayali 850, Cercado de Lima</li>
            <li>Ingresa al portal y registra el courier + número de guía en tu lote</li>
          </ol>
          <hr style="border: none; border-top: 1px solid #e8e2da; margin: 24px 0;" />
          <p style="color: #c4b297; font-size: 12px;">Tunay Wasi — Plataforma B2B de café de especialidad</p>
        </div>
        `
      );
    }
  });

// ── 11. REPORTE DIARIO DE ANALYTICS — corre a las 11:00 PM hora Lima ──────────
//
// Lee la colección `one_analytics` del día anterior, calcula el funnel
// de conversión y envía un reporte HTML a tunaywasi@gmail.com.
// Colección: one_analytics/{docId}
// Campos esperados: evento, sessionId, userId, rolUsuario, fecha (YYYY-MM-DD)

export const reporteDiarioAnalytics = functions
  .region("us-central1")
  .pubsub.schedule("0 23 * * *")
  .timeZone("America/Lima")
  .onRun(async () => {
    // Fecha del día actual (Lima)
    const hoy = new Date().toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).split("/").reverse().join("-") // → "YYYY-MM-DD"

    functions.logger.info("reporteDiarioAnalytics: procesando", { fecha: hoy });

    // Leer todos los eventos del día
    const snap = await db
      .collection("one_analytics")
      .where("fecha", "==", hoy)
      .get();

    if (snap.empty) {
      functions.logger.info("reporteDiarioAnalytics: sin eventos hoy");
      return;
    }

    const eventos = snap.docs.map(d => d.data() as {
      evento: string;
      sessionId: string;
      userId: string;
      rolUsuario: string;
      productoId?: string;
      productoNombre?: string;
      itemCount?: number;
      totalCents?: number;
      metodoPago?: string;
      pedidoId?: string;
      mobile?: boolean;
    });

    // ── Métricas de funnel ────────────────────────────────────────────────────

    const contar = (ev: string) => eventos.filter(e => e.evento === ev).length;
    const sesionesUnicas = (ev: string) =>
      new Set(eventos.filter(e => e.evento === ev).map(e => e.sessionId)).size;

    const totalEventos = eventos.length;
    const sesionesTotal = new Set(eventos.map(e => e.sessionId)).size;
    const usuariosAnonimos = new Set(eventos.filter(e => e.userId === "anonimo").map(e => e.sessionId)).size;
    const usuariosAuth = new Set(eventos.filter(e => e.userId !== "anonimo").map(e => e.userId)).size;
    const mobile = eventos.filter(e => e.mobile === true).length;
    const mobilePorc = totalEventos > 0 ? Math.round((mobile / totalEventos) * 100) : 0;

    // Funnel
    const f_catalogo = sesionesUnicas("catalogo_visto");
    const f_carrito = sesionesUnicas("carrito_agregado");
    const f_checkout_intent = sesionesUnicas("checkout_intentado");
    const f_login_req = contar("login_requerido");
    const f_login_ok = contar("login_exitoso");
    const f_registro = contar("registro_completado");
    const f_checkout = sesionesUnicas("checkout_inicio");
    const f_pago = sesionesUnicas("checkout_paso2");
    const f_confirmado = contar("checkout_confirmado");
    const errores = contar("error_capturado");

    // Tasa de conversión catálogo → pedido
    const convRate = f_catalogo > 0 ? ((f_confirmado / f_catalogo) * 100).toFixed(1) : "0.0";
    const abandonoLogin = f_login_req > 0
      ? `${Math.round(((f_login_req - f_login_ok) / f_login_req) * 100)}% no completaron login`
      : "—";

    // Productos más vistos / agregados
    const productosAgregados: Record<string, number> = {};
    for (const e of eventos.filter(ev => ev.evento === "carrito_agregado")) {
      const nombre = e.productoNombre ?? e.productoId ?? "desconocido";
      productosAgregados[nombre] = (productosAgregados[nombre] ?? 0) + 1;
    }
    const topProductos = Object.entries(productosAgregados)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n, c]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #333">${n}</td><td style="padding:6px 10px;border-bottom:1px solid #333;text-align:center">${c}x</td></tr>`)
      .join("") || '<tr><td colspan="2" style="padding:6px 10px;color:#888">Sin datos</td></tr>';

    // Total recaudado estimado del día
    const totalCentsDia = eventos
      .filter(e => e.evento === "checkout_confirmado" && e.totalCents)
      .reduce((s, e) => s + (e.totalCents ?? 0), 0);
    const totalSoles = (totalCentsDia / 100).toFixed(0);

    // ── Generar HTML del reporte ──────────────────────────────────────────────

    const funnelRow = (label: string, n: number, base: number, color: string) => {
      const pct = base > 0 ? Math.round((n / base) * 100) : 0;
      const bar = Math.max(4, pct);
      return `
        <tr>
          <td style="padding:8px 12px;color:#c4b297;font-size:13px">${label}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:#f2e0cc">${n}</td>
          <td style="padding:8px 12px">
            <div style="background:#1f1f1f;border-radius:4px;overflow:hidden;height:14px">
              <div style="background:${color};height:14px;width:${bar}%;border-radius:4px"></div>
            </div>
            <span style="font-size:10px;color:#666">${pct}%</span>
          </td>
        </tr>`;
    };

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#0a0a0a;color:#f2e0cc;font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:24px">
  <div style="max-width:640px;margin:0 auto">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1f3028,#0a1a10);border-radius:12px;padding:24px 28px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:.1em;color:#8faf8a;text-transform:uppercase">Tunay Wasi · Analytics</p>
      <h1 style="margin:0 0 4px;font-size:26px;font-weight:700;color:#f2e0cc">Reporte del ${hoy}</h1>
      <p style="margin:0;font-size:13px;color:#8faf8a">${sesionesTotal} sesiones · ${totalEventos} eventos · ${usuariosAnonimos} anónimos · ${usuariosAuth} autenticados</p>
    </div>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      ${[
        { label: "Pedidos hoy", value: f_confirmado, color: "#8faf8a" },
        { label: "Recaudado estimado", value: `S/ ${totalSoles}`, color: "#c96e4b" },
        { label: "Conversión", value: `${convRate}%`, color: "#c4b297" },
      ].map(k => `
        <div style="background:#141414;border:1px solid #222;border-radius:10px;padding:16px;text-align:center">
          <p style="margin:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#555">${k.label}</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:${k.color}">${k.value}</p>
        </div>`).join("")}
    </div>

    <!-- Funnel -->
    <div style="background:#111;border:1px solid #222;border-radius:10px;margin-bottom:20px;overflow:hidden">
      <div style="padding:14px 18px;border-bottom:1px solid #222">
        <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#555">Funnel de conversión</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${funnelRow("Visitaron catálogo", f_catalogo, f_catalogo, "#4a90c4")}
        ${funnelRow("Agregaron al carrito", f_carrito, f_catalogo, "#8faf8a")}
        ${funnelRow("Intentaron checkout", f_checkout_intent, f_catalogo, "#c4b297")}
        ${funnelRow("Bloqueados por login", f_login_req, f_checkout_intent, "#d4a017")}
        ${funnelRow("Login exitoso", f_login_ok, f_login_req || 1, "#8faf8a")}
        ${funnelRow("Registros nuevos", f_registro, f_login_ok || 1, "#9b59b6")}
        ${funnelRow("Entraron al checkout", f_checkout, f_catalogo, "#c96e4b")}
        ${funnelRow("Llegaron al pago", f_pago, f_checkout || 1, "#e07050")}
        ${funnelRow("Pedido confirmado", f_confirmado, f_pago || 1, "#8faf8a")}
      </table>
    </div>

    <!-- Top productos -->
    <div style="background:#111;border:1px solid #222;border-radius:10px;margin-bottom:20px;overflow:hidden">
      <div style="padding:14px 18px;border-bottom:1px solid #222">
        <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#555">Top productos agregados al carrito</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${topProductos}
      </table>
    </div>

    <!-- Insights -->
    <div style="background:#141414;border:1px solid #222;border-radius:10px;padding:18px 20px;margin-bottom:20px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#555">Insights del día</p>
      <ul style="margin:0;padding-left:18px;color:#c4b297;font-size:13px;line-height:2">
        <li>Abandono en login: <strong>${abandonoLogin}</strong></li>
        <li>Tráfico mobile: <strong>${mobilePorc}%</strong> del total</li>
        <li>Errores JS capturados: <strong>${errores}</strong></li>
        ${f_login_req > f_confirmado ? `<li style="color:#d4a017">⚠️ ${f_login_req} usuarios bloqueados por login — evalúa simplificar el acceso</li>` : ""}
        ${f_carrito > f_checkout_intent * 2 ? `<li style="color:#d4a017">⚠️ Mucho carrito, poco checkout — ¿el botón es visible?</li>` : ""}
        ${errores > 5 ? `<li style="color:#e05a4e">🔴 ${errores} errores JS — revisar logs de Firebase</li>` : ""}
      </ul>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#333;margin-top:24px">
      Generado automáticamente por Tunay Wasi Analytics · ${hoy}
    </p>
  </div>
</body>
</html>`;

    await sendEmail(
      "tunaywasi@gmail.com",
      `📊 Tunay Wasi — Analytics ${hoy} | ${f_confirmado} pedidos · S/ ${totalSoles} · Conv ${convRate}%`,
      html
    );

    functions.logger.info("reporteDiarioAnalytics: reporte enviado", {
      fecha: hoy,
      sesiones: sesionesTotal,
      pedidos: f_confirmado,
      totalSoles,
    });
  });


export const extraerLoteDesdeVoz = functions
  .region("us-central1")
  .https.onCall(async (data) => {
    const { transcripcion } = data;

    if (!transcripcion || typeof transcripcion !== "string" || transcripcion.trim().length < 5) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Se requiere el campo transcripcion"
      );
    }

    const apiKey = process.env.KIMI_API_KEY || "";
    if (!apiKey) {
      throw new functions.https.HttpsError("internal", "Kimi API key no configurada");
    }

    const PROCESOS_VALIDOS = ["lavado", "natural", "honey", "anaerobico", "doble_fermentacion"];
    const anio = new Date().getFullYear();

    const systemPrompt = `Eres un asistente de Tunay Wasi, plataforma de café de especialidad peruano.
Extrae datos de un lote de café desde texto libre en español (puede ser transcripción de audio).
Devuelve SOLO un JSON válido con exactamente estos campos (usa null si no se menciona):
{
  "nombreLote": string | null,
  "variedad": string | null,
  "proceso": "lavado" | "natural" | "honey" | "anaerobico" | "doble_fermentacion" | null,
  "altitud": string | null,
  "kgDisponibles": string | null,
  "precioKgPEN": string | null,
  "cosecha": string | null
}
Reglas:
- proceso: normaliza sinónimos ("fermentado natural"→"natural", "miel"→"honey", "washed"→"lavado")
- altitud: solo el número sin unidad (ej: "1800")
- cosecha: formato "Mes YYYY" (ej: "Junio ${anio}") — si no dice el año asume ${anio}
- precioKgPEN y kgDisponibles: solo el número sin texto
- No inventes datos que no estén en el texto`;

    const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k3",
        max_tokens: 256,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcripcion.trim() },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      functions.logger.error("Kimi API error", { status: response.status, err });
      throw new functions.https.HttpsError("internal", "Error al llamar a Kimi API");
    }

    const json = await response.json() as { choices: { message: { content: string } }[] };
    const rawText = json.choices[0].message.content.trim();
    const campos = JSON.parse(rawText);

    // Validar que proceso sea uno de los valores permitidos
    if (campos.proceso && !PROCESOS_VALIDOS.includes(campos.proceso)) {
      campos.proceso = null;
    }

    return { ok: true, campos };
  });

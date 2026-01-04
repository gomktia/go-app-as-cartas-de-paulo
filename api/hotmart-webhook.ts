/**
 * Vercel Serverless Function
 * Endpoint: /api/hotmart-webhook
 *
 * Recebe webhooks (Postback) da Hotmart e processa compras
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!; // Service Key (não a anon key!)
const HOTMART_SECRET = process.env.HOTMART_WEBHOOK_SECRET || ''; // Secret configurado na Hotmart

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Valida assinatura do webhook da Hotmart
 */
function validateHotmartSignature(
  body: string,
  signature: string | undefined
): boolean {
  if (!HOTMART_SECRET || !signature) {
    console.warn('⚠️ Validação de assinatura desabilitada (configurar HOTMART_WEBHOOK_SECRET)');
    return true; // Em desenvolvimento, aceitar sem validação
  }

  try {
    const hash = crypto
      .createHmac('sha256', HOTMART_SECRET)
      .update(body)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    console.error('❌ Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * Processa webhook da Hotmart
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📨 Webhook recebido da Hotmart');

  try {
    // 1. Validar assinatura
    const signature = req.headers['x-hotmart-hottok'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!validateHotmartSignature(rawBody, signature)) {
      console.error('❌ Assinatura inválida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Assinatura validada');

    // 2. Extrair dados do webhook
    const webhookData = req.body;
    const event = webhookData.event;

    console.log('📦 Evento:', event);
    console.log('📄 Dados:', JSON.stringify(webhookData, null, 2));

    // 3. Processar apenas eventos relevantes
    const relevantEvents = [
      'PURCHASE_APPROVED',
      'PURCHASE_COMPLETE',
      'PURCHASE_CANCELED',
      'PURCHASE_REFUNDED',
      'PURCHASE_CHARGEBACK'
    ];

    if (!relevantEvents.includes(event)) {
      console.log('ℹ️ Evento ignorado:', event);
      return res.status(200).json({ message: 'Event ignored' });
    }

    // 4. Chamar função do Supabase para processar
    const { data, error } = await supabase.rpc('process_hotmart_webhook', {
      p_webhook_data: webhookData
    });

    if (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Webhook processado com sucesso:', data);

    // 5. Enviar email de boas-vindas (opcional)
    if (event === 'PURCHASE_APPROVED') {
      const email = webhookData?.data?.buyer?.email;
      const name = webhookData?.data?.buyer?.name;

      console.log(`📧 TODO: Enviar email de boas-vindas para ${name} (${email})`);
      // Aqui você pode integrar com SendGrid, Resend, etc.
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data
    });

  } catch (error: any) {
    console.error('❌ Erro inesperado:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

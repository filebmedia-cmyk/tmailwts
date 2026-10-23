import PostalMime from 'postal-mime';

/**
 * Cloudflare Email Worker for TMail
 * Intercepts incoming emails via Cloudflare Email Routing catch-all rule,
 * parses MIME/body/attachments, and forwards them to your Vercel webhook.
 */

export default {
  // Cloudflare Email Routing handler
  async email(message, env, ctx) {
    try {
      const rawEmail = await new Response(message.raw).arrayBuffer();
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      const payload = {
        to: message.to ? [message.to] : (parsed.to ? parsed.to.map(t => t.address) : []),
        from: {
          address: message.from || parsed.from?.address || 'unknown@sender.com',
          name: parsed.from?.name || undefined,
        },
        subject: parsed.subject || message.headers.get('subject') || '(No Subject)',
        text: parsed.text || '',
        html: parsed.html || '',
        attachments: (parsed.attachments || []).map(att => ({
          filename: att.filename || 'attachment',
          contentType: att.mimeType || 'application/octet-stream',
          size: att.content?.byteLength || 0,
        })),
        date: parsed.date || new Date().toISOString(),
      };

      const webhookUrl = env.WEBHOOK_URL || 'https://oursastore.com/api/webhook/email';
      const webhookSecret = env.WEBHOOK_SECRET || 'tm_whsec_cloudflare_secret_2026';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to forward email to webhook [${response.status}]: ${errorText}`);
      } else {
        console.log(`Email successfully delivered for ${message.to} -> ${webhookUrl}`);
      }
    } catch (err) {
      console.error('Email Worker processing failed:', err);
    }
  },

  // Optional HTTP health check endpoint
  async fetch(request, env, ctx) {
    return new Response(JSON.stringify({ 
      status: 'active', 
      domain: 'oursastore.com',
      service: 'TMail Cloudflare Email Worker',
      webhookConfigured: Boolean(env.WEBHOOK_URL),
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

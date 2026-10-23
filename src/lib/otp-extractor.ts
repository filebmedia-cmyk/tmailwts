/**
 * Smart extractor for OTP verification codes and activation links
 * Designed specifically for bot automation (Telegram bot, Selenium, Puppeteer, QA)
 */

export interface ExtractedOtpData {
  otpCode?: string;
  verificationLinks: string[];
}

export function extractOtpAndLinks(text?: string, html?: string): ExtractedOtpData {
  const combinedContent = `${text || ''}\n${stripHtml(html || '')}`;
  const verificationLinks: string[] = [];

  // 1. Extract Links from HTML and plain text
  const linkRegex = /https?:\/\/[^\s"'<>]+/gi;
  const rawLinks: string[] = Array.from(combinedContent.match(linkRegex) || []);
  
  if (html) {
    const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      if (match[1]) rawLinks.push(match[1]);
    }
  }

  // Filter links for verification/activation keywords
  const verifyKeywords = ['verify', 'verification', 'confirm', 'confirmation', 'activate', 'activation', 'token', 'validate', 'auth', 'signup', 'register'];
  for (const link of rawLinks) {
    const cleanLink = link.replace(/&amp;/g, '&').replace(/[.,;)\]]+$/, '');
    const lower = cleanLink.toLowerCase();
    if (verifyKeywords.some(kw => lower.includes(kw))) {
      if (!verificationLinks.includes(cleanLink)) {
        verificationLinks.push(cleanLink);
      }
    }
  }

  // 2. Extract OTP Code (4 to 8 digits)
  let otpCode: string | undefined;

  // High confidence patterns (context-aware)
  const highConfidencePatterns = [
    /(?:verification\s*code|kode\s*verifikasi|security\s*code|otp\s*code|your\s*code\s*is|is\s*your\s*code|use\s*code|enter\s*code|pin\s*code|kode\s*anda|code\s*:?)\s*[:=\s-]*\s*([0-9]{4,8})/i,
    /(?:otp|code|pin)\s*[:#\s-]*\s*([0-9]{4,8})/i,
    /([0-9]{4,8})\s*(?:is\s*your\s*verification|adalah\s*kode\s*verifikasi)/i,
    /\b([0-9]{3}[-\s][0-9]{3})\b/ // Format 123-456 or 123 456
  ];

  for (const pattern of highConfidencePatterns) {
    const match = combinedContent.match(pattern);
    if (match && match[1]) {
      otpCode = match[1].replace(/[-\s]/g, '');
      break;
    }
  }

  // Fallback: look for 4-6 digit standalone numbers surrounded by word boundaries if not found
  if (!otpCode) {
    const fallbackMatch = combinedContent.match(/\b([0-9]{6})\b/) || combinedContent.match(/\b([0-9]{4})\b/);
    if (fallbackMatch && fallbackMatch[1]) {
      // Ignore common years like 2024, 2025, 2026, 2027
      const num = parseInt(fallbackMatch[1], 10);
      if (!(num >= 2000 && num <= 2030)) {
        otpCode = fallbackMatch[1];
      }
    }
  }

  return {
    otpCode,
    verificationLinks
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

import emailjs from '@emailjs/browser';

// ── YOUR EMAILJS KEYS — paste from dashboard ──────────────────
const SERVICE_ID       = 'service_nhog3wp';    // Email Services → Service ID
const OTP_TEMPLATE_ID  = 'template_xgzxfph';   // One-Time Password template ID
const ALERT_TEMPLATE_ID= 'template_143kmri';   // centurion_alert template ID
const PUBLIC_KEY       = 'OGm0btddjPxjwRZ3b';// Account → General → Public Key

emailjs.init(PUBLIC_KEY);

// ── Generate 6-digit OTP ──────────────────────────────────────
export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Send OTP email ────────────────────────────────────────────
export async function sendOTP(toEmail, toName = 'User') {
  const otp = generateOTP();
  try {
    await emailjs.send(SERVICE_ID, OTP_TEMPLATE_ID, {
      to_email:  toEmail,
      to_name:   toName,
      otp:       otp,
      timestamp: new Date().toLocaleString(),
    });
    console.log('[EMAIL] OTP sent to', toEmail);
    return { success: true, otp };
  } catch(err) {
    console.error('[EMAIL] OTP error:', err);
    return { success: false, error: err.text || err.message };
  }
}

// ── Send unauthorized access alert ───────────────────────────
export async function sendSecurityAlert(adminEmail, details = {}) {
  try {
    await emailjs.send(SERVICE_ID, ALERT_TEMPLATE_ID, {
      to_email:           adminEmail,
      timestamp:          new Date().toLocaleString(),
      ip_address:         details.ipAddress          || 'unknown',
      attempt_count:      details.attemptCount       || 1,
      estimated_age:      details.estimatedAge       || 'unknown',
      estimated_gender:   details.estimatedGender    || 'unknown',
      estimated_ethnicity:details.estimatedEthnicity || 'unknown',
      liveness_status:    details.livenessPass ? 'PASS ✓' : 'FAIL ✗',
      snapshot_path:      details.snapshotPath       || 'none',
    });
    console.log('[EMAIL] Alert sent to', adminEmail);
    return { success: true };
  } catch(err) {
    console.error('[EMAIL] Alert error:', err);
    return { success: false, error: err.text || err.message };
  }
}

// ── Send summary report ───────────────────────────────────────
export async function sendSummaryReport(toEmail, summaryText) {
  try {
    await emailjs.send(SERVICE_ID, ALERT_TEMPLATE_ID, {
      to_email:           toEmail,
      timestamp:          new Date().toLocaleString(),
      ip_address:         'N/A — Summary Report',
      attempt_count:      summaryText,
      estimated_age:      'See summary above',
      estimated_gender:   '',
      estimated_ethnicity:'',
      liveness_status:    '',
      snapshot_path:      '',
    });
    return { success: true };
  } catch(err) {
    return { success: false, error: err.text || err.message };
  }
}

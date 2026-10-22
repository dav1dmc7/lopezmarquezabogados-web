ALTER TABLE consultations ADD COLUMN internal_notification_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE consultations ADD COLUMN customer_confirmation_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE consultations ADD COLUMN notification_provider TEXT NOT NULL DEFAULT 'unknown';

-- Preserve the most accurate interpretation available from the previous status.
UPDATE consultations SET internal_notification_status = CASE
  WHEN status = 'notified' THEN 'sent'
  WHEN status = 'stored_pending_notification' THEN 'failed'
  ELSE 'pending'
END;
UPDATE consultations SET customer_confirmation_status = 'not_sent_before_migration';
UPDATE consultations SET notification_provider = 'cloudflare_email_service'
WHERE status IN ('notified', 'stored_pending_notification');

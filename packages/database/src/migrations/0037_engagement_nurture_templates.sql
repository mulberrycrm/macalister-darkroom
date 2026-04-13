-- Engagement nurture automation sequences
-- Stage 1 (lead nurture, Days 0-5) + questionnaire response (Wellington vs out-of-town)
--
-- NOTE: The `automations_templates` table defined in 0004 does not exist in the live DB.
-- The `automations` table stores all step content inline in the `steps` JSONB column.
-- These records were seeded via the Supabase JS client on 2026-04-06.
-- This SQL is retained for documentation and re-seeding on future environments.
--
-- Three automations, all inactive by default (activate via /automations in the CRM):
--
--  1. "Engagement Nurture — All Clients"
--     Trigger: tag "engagement-entry"
--     Steps: entry-sms, entry-email, wait 1d, nurture-1-email, wait 2d,
--            nurture-2-email, wait 2d, winner-email, winner-sms
--
--  2. "Engagement Questionnaire Response — Wellington"
--     Trigger: tag "engagement-questionnaire-wgtn"
--     Steps: book-call-email, book-call-sms
--
--  3. "Engagement Questionnaire Response — Out of Town"
--     Trigger: tag "engagement-questionnaire-outoftown"
--     Steps: waitlist-email
--
-- Variables used in templates:
--   {contactFirstName}  — contact.known_as or first_name
--   {questionnaireUrl}  — engagement questionnaire link (set when firing automation)
--   {bookCallUrl}       — enquiry call booking link (set when firing automation)
--   {contactRegion}     — contact.region (e.g. "Kāpiti Coast")

DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  FOR v_tenant_id IN SELECT id FROM tenants
  LOOP

    -- Automation 1: Shared nurture sequence (all clients, Days 0–5)
    INSERT INTO automations (tenant_id, name, trigger_type, trigger_config, steps, is_active)
    VALUES (
      v_tenant_id,
      'Engagement Nurture — All Clients',
      'tag_applied',
      '{"tagName": "engagement-entry"}'::jsonb,
      '[
        {
          "type": "send_sms",
          "delayMinutes": 0,
          "template": "Hi {contactFirstName}, thanks for entering my free engagement session giveaway! Keep an eye on your inbox – I''ll announce the winner in a few days. – Rainer"
        },
        {
          "type": "send_email",
          "delayMinutes": 0,
          "subject": "You''re entered – free engagement session giveaway",
          "template": "Hi {contactFirstName},\n\nThank you so much for entering my free engagement session giveaway – I''m really excited about this one!\n\nHere''s what to expect: I''ll be drawing the winner in the next few days and will let you know by email and text. If you win, you''ll get a full engagement session with me at one of my favourite spots around Wellington (or wherever works for you best). No charge, no catch.\n\nIn the meantime, feel free to browse my work at macalister.nz to get a feel for my style.\n\nFingers crossed for you!\n\nRainer\nMacalister Photography\nmacalister.nz"
        },
        {
          "type": "wait",
          "delayMinutes": 1440
        },
        {
          "type": "send_email",
          "delayMinutes": 0,
          "subject": "What actually happens at an engagement session",
          "template": "Hi {contactFirstName},\n\nWhile you wait to hear if you''ve won, I thought I''d walk you through what an engagement session actually looks like.\n\nIt''s basically a photo shoot for you and your partner, usually somewhere beautiful or meaningful. I''m based in Wellington, so Tītahi Bay and Whitireia Park are two of my favourites – but we can go anywhere that works for you.\n\nHere''s how it typically goes:\n\n– We start with a wander and a chat. Most people feel a bit awkward at first, but that wears off pretty quickly once we''re moving.\n– I''ll give you a bit of direction, but mostly I''m looking for the quiet in-between moments – the laughing, the looking at each other, the stuff that''s just you two.\n– Sessions usually run about an hour.\n\nThe photos you get back feel natural and real. They''re also a great way to get comfortable with being photographed before your wedding day – so by the time we''re on the big day, you already know how I work.\n\nTalk soon,\nRainer\nMacalister Photography\nmacalister.nz"
        },
        {
          "type": "wait",
          "delayMinutes": 2880
        },
        {
          "type": "send_email",
          "delayMinutes": 0,
          "subject": "In case you''re thinking about wedding photos too...",
          "template": "Hi {contactFirstName},\n\nI know this giveaway is for an engagement session, but I wanted to share a bit about my wedding photography while I have your attention.\n\nWedding days are a bit like engagement sessions, but turned up to eleven. More people, more emotion, more happening all at once. I shoot documentary-style – I''m not the photographer who lines everyone up for endless posed shots. I''m more interested in the candid stuff: the way your mum looks at you before you walk down the aisle, the first person to cry, the friend who can''t hold it together during speeches.\n\nI''d love to be there for your wedding if you''re still looking for a photographer. You can see more of my work at macalister.nz/weddings.\n\nEither way, I hope you win this session!\n\nRainer\nMacalister Photography\nmacalister.nz"
        },
        {
          "type": "wait",
          "delayMinutes": 2880
        },
        {
          "type": "send_email",
          "delayMinutes": 0,
          "subject": "Congratulations – you''ve won a free engagement session!",
          "template": "Hi {contactFirstName},\n\nI''ve got great news – you''ve won my free engagement session giveaway!\n\nHere''s what happens next:\n\n1. Fill in a short questionnaire so I can learn a bit about you and your partner before we chat.\n2. We''ll jump on a quick call to talk through the details and make sure we''re a good fit.\n3. We''ll lock in a date and location that works for you both.\n\nPlease fill in the questionnaire here:\n{questionnaireUrl}\n\nI''m really looking forward to working with you both.\n\nRainer\nMacalister Photography\nmacalister.nz"
        },
        {
          "type": "send_sms",
          "delayMinutes": 0,
          "template": "Hi {contactFirstName}, congratulations – you''ve won my free engagement session! Check your email for what happens next. – Rainer"
        }
      ]'::jsonb,
      false
    ) ON CONFLICT DO NOTHING;

    -- Automation 2: Questionnaire response — Wellington clients
    INSERT INTO automations (tenant_id, name, trigger_type, trigger_config, steps, is_active)
    VALUES (
      v_tenant_id,
      'Engagement Questionnaire Response — Wellington',
      'tag_applied',
      '{"tagName": "engagement-questionnaire-wgtn"}'::jsonb,
      '[
        {
          "type": "send_email",
          "delayMinutes": 0,
          "subject": "Let''s book your enquiry call",
          "template": "Hi {contactFirstName},\n\nThanks for filling in the questionnaire – it''s really helpful to know a bit more about you both before we chat.\n\nThe next step is a quick 20-minute call so we can get to know each other, talk through what you''re after, and answer any questions you have. It''s a low-key chat – no pressure at all.\n\nYou can book a time that works for you here:\n{bookCallUrl}\n\nLooking forward to talking!\n\nRainer\nMacalister Photography\nmacalister.nz"
        },
        {
          "type": "send_sms",
          "delayMinutes": 0,
          "template": "Hi {contactFirstName}, thanks for your questionnaire! Book your free enquiry call here: {bookCallUrl} – Rainer"
        }
      ]'::jsonb,
      false
    ) ON CONFLICT DO NOTHING;

    -- Automation 3: Questionnaire response — Out-of-town clients
    INSERT INTO automations (tenant_id, name, trigger_type, trigger_config, steps, is_active)
    VALUES (
      v_tenant_id,
      'Engagement Questionnaire Response — Out of Town',
      'tag_applied',
      '{"tagName": "engagement-questionnaire-outoftown"}'::jsonb,
      '[
        {
          "type": "send_email",
          "delayMinutes": 0,
          "subject": "Thanks for your questionnaire!",
          "template": "Hi {contactFirstName},\n\nThanks so much for filling that in – it''s great to learn a bit more about you both.\n\nBecause you''re based outside of Wellington, I travel to your area on a rotating basis. I''ll be in touch as soon as I''m taking bookings for {contactRegion} – usually a few weeks out from when I''m next in the area.\n\nIn the meantime, feel free to have a browse at macalister.nz and reach out any time if you have questions.\n\nLooking forward to meeting you both!\n\nRainer\nMacalister Photography\nmacalister.nz"
        }
      ]'::jsonb,
      false
    ) ON CONFLICT DO NOTHING;

  END LOOP;
END $$;

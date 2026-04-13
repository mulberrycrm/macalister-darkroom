-- Add tag fields to questionnaires for automation triggering on completion.
-- on_complete_tag: tag applied to the contact when the questionnaire is submitted.
-- on_complete_tag_outoftown: if set, contacts outside Wellington get this tag instead.
--   Wellington = contacts whose region IS NULL or matches a Wellington-area name.

ALTER TABLE questionnaires
  ADD COLUMN IF NOT EXISTS on_complete_tag text,
  ADD COLUMN IF NOT EXISTS on_complete_tag_outoftown text;

COMMENT ON COLUMN questionnaires.on_complete_tag IS
  'Tag applied to the contact on questionnaire submission. For location-split automations, this is the Wellington/default tag.';
COMMENT ON COLUMN questionnaires.on_complete_tag_outoftown IS
  'If set, contacts whose region is outside Wellington receive this tag instead of on_complete_tag.';

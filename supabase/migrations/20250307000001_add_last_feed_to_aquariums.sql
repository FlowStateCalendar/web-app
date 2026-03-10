-- Add last_feed to aquariums for fish health decay logic (if not fed in 24h, fish health is halved by daily-aquarium-upkeep).
ALTER TABLE aquariums ADD COLUMN IF NOT EXISTS last_feed TIMESTAMPTZ NULL;

-- Add share token fields to khata_party table
ALTER TABLE khata_party ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE khata_party ADD COLUMN IF NOT EXISTS share_token_created_at TIMESTAMP;

-- Create index on share_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_khata_party_share_token ON khata_party(share_token);

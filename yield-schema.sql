ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS base_price_per_hour numeric DEFAULT 100,
ADD COLUMN IF NOT EXISTS peak_hour_multiplier numeric DEFAULT 1.2,
ADD COLUMN IF NOT EXISTS weekend_multiplier numeric DEFAULT 1.15,
ADD COLUMN IF NOT EXISTS is_outdoor boolean DEFAULT true;

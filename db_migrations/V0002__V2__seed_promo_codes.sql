INSERT INTO kzc_promo_codes (code, reward, max_uses)
SELECT 'KAZAH500', 500, 1000
WHERE NOT EXISTS (SELECT 1 FROM kzc_promo_codes WHERE code = 'KAZAH500');

INSERT INTO kzc_promo_codes (code, reward, max_uses)
SELECT 'BONUS200', 200, 500
WHERE NOT EXISTS (SELECT 1 FROM kzc_promo_codes WHERE code = 'BONUS200');

INSERT INTO kzc_promo_codes (code, reward, max_uses)
SELECT 'LUCKY777', 777, 300
WHERE NOT EXISTS (SELECT 1 FROM kzc_promo_codes WHERE code = 'LUCKY777');
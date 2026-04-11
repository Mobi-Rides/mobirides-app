UPDATE insurance_packages SET premium_percentage = 0.10 WHERE name = 'basic';
UPDATE insurance_packages SET premium_percentage = 0.15 WHERE name = 'standard';
UPDATE insurance_packages SET premium_percentage = 0.20 WHERE name = 'premium';
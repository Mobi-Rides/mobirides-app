import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairCarImages() {
  console.log('Starting repair of car images...');

  // 1. Get all cars with null image_url
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, brand, model')
    .is('image_url', null);

  if (carsError) {
    console.error('Error fetching cars:', carsError);
    return;
  }

  console.log(`Found ${cars.length} cars with missing cover photos.`);

  for (const car of cars) {
    console.log(`Checking images for ${car.brand} ${car.model} (${car.id})...`);

    // 2. Get images for this car from car_images table
    const { data: images, error: imagesError } = await supabase
      .from('car_images')
      .select('*')
      .eq('car_id', car.id)
      .order('is_primary', { ascending: false }) // Prefer primary
      .order('created_at', { ascending: true }); // Then oldest

    if (imagesError) {
      console.error(`Error fetching images for car ${car.id}:`, imagesError);
      continue;
    }

    if (images && images.length > 0) {
      const bestImage = images[0];
      console.log(`Found ${images.length} images. Best match: ${bestImage.image_url} (Primary: ${bestImage.is_primary})`);

      // 3. Update the car with this image
      const { error: updateError } = await supabase
        .from('cars')
        .update({ image_url: bestImage.image_url })
        .eq('id', car.id);

      if (updateError) {
        console.error(`Failed to update car ${car.id}:`, updateError);
      } else {
        console.log(`✅ Fixed cover photo for ${car.brand} ${car.model}`);
      }
    } else {
      console.log(`No images found in car_images for ${car.brand} ${car.model}`);
    }
  }
  console.log('Repair complete.');
}

repairCarImages();

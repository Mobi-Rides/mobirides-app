import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
});

async function run() {
  try {
    const issue129 = await client.issue('MOB-129');
    console.log(`Updating ${issue129.identifier} to Done...`);
    await issue129.update({ stateId: 'a601f9e7-1216-44ed-8684-f32b38b6f3fa' });
    console.log(`Successfully updated ${issue129.identifier} to Done.`);

    const issue123 = await client.issue('MOB-123');
    console.log(`Updating ${issue123.identifier} to Done...`);
    await issue123.update({ stateId: 'a601f9e7-1216-44ed-8684-f32b38b6f3fa' });
    console.log(`Successfully updated ${issue123.identifier} to Done.`);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
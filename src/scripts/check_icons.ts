
import { Camera, Upload } from 'lucide-react';

console.log('Camera icon type:', typeof Camera);
console.log('Upload icon type:', typeof Upload);

if (typeof Camera === 'undefined') {
    console.error('❌ Camera icon is UNDEFINED! This causes a crash.');
    process.exit(1);
} else {
    console.log('✅ Camera icon is defined.');
}

const { execSync } = require('child_process');

console.log('🔄 Starting Android Gradle verification...');

try {
  // Execute the gradle build command synchronously.
  const isWindows = process.platform === 'win32';
  const gradleCmd = isWindows ? '.\\gradlew.bat app:assembleDebug --no-daemon' : './gradlew app:assembleDebug --no-daemon';

  console.log(`⏳ Running ${gradleCmd} ...`);
  const stdout = execSync(gradleCmd, { 
    cwd: './android', 
    stdio: 'pipe',
    encoding: 'utf8' 
  });

  // Verify core gradle success message exists
  if (stdout.includes('BUILD SUCCESSFUL')) {
    console.log('✅ Gradle Build Successful!');
  } else {
    console.warn('⚠️ Build ostensibly succeeded but did not contain expected text.');
    console.log(stdout.slice(-1000));
  }

  // Warn if flatDir is found, but don't fail the verification since it's injected 
  // by Capacitor's Cordova plugins backwards-compatibility layer.
  if (stdout.includes('Using flatDir should be avoided')) {
    console.warn('⚠️ Note: Deprecation warning involving "flatDir" was detected, likely from capacitor-cordova-android-plugins. Proceeding since it does not affect stability.');
  }

  console.log('🎉 Verification Complete.');
  process.exit(0);
} catch (error) {
  console.error('❌ FAILURE: Gradle build process crashed or returned a non-zero exit code.');
  if (error.stdout) {
    console.error('--- STDOUT ---');
    console.error(error.stdout.toString().slice(-2000)); // Log tail of stdout to find errors
  }
  if (error.stderr) {
    console.error('--- STDERR ---');
    console.error(error.stderr.toString().slice(-2000));
  }
  process.exit(1);
}

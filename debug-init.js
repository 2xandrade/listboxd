// Debug script to check app initialization
console.log('=== DEBUG SCRIPT LOADED ===');

// Check if DOM is ready
if (document.readyState === 'loading') {
  console.log('DOM is still loading...');
  document.addEventListener('DOMContentLoaded', debugInit);
} else {
  console.log('DOM already loaded, running debug...');
  debugInit();
}

function debugInit() {
  console.log('=== RUNNING DEBUG CHECKS ===');
  
  // Check 1: Config
  console.log('1. Checking CONFIG...');
  if (typeof CONFIG !== 'undefined') {
    console.log('✓ CONFIG exists:', CONFIG);
  } else {
    console.error('✗ CONFIG is undefined!');
  }
  
  // Check 2: Notification Service
  console.log('2. Checking notificationService...');
  if (typeof notificationService !== 'undefined') {
    console.log('✓ notificationService exists');
  } else {
    console.error('✗ notificationService is undefined!');
  }
  
  // Check 3: Login Section
  console.log('3. Checking login section...');
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    console.log('✓ Login section found');
    console.log('  - Has hidden class:', loginSection.classList.contains('hidden'));
    console.log('  - Computed display:', window.getComputedStyle(loginSection).display);
  } else {
    console.error('✗ Login section NOT found!');
  }
  
  // Check 4: Services
  setTimeout(() => {
    console.log('4. Checking services (after 1 second)...');
    const services = [
      'googleSheetsApi',
      'storageManager',
      'authService',
      'userService',
      'filmService',
      'listService',
      'filterManager',
      'tabManager'
    ];
    
    services.forEach(serviceName => {
      if (typeof window[serviceName] !== 'undefined') {
        console.log(`✓ ${serviceName} exists`);
      } else {
        console.error(`✗ ${serviceName} is undefined!`);
      }
    });
    
    // Check if login section is visible
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      const isHidden = loginSection.classList.contains('hidden');
      console.log('5. Login section status after init:');
      console.log('  - Has hidden class:', isHidden);
      console.log('  - Should be visible:', !isHidden);
      
      if (isHidden) {
        console.error('✗ LOGIN SECTION IS STILL HIDDEN!');
        console.log('Attempting to show it manually...');
        loginSection.classList.remove('hidden');
        console.log('  - Hidden class removed');
      } else {
        console.log('✓ Login section is visible');
      }
    }
  }, 1000);
}

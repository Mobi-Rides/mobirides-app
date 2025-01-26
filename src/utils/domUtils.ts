export const createMarkerElement = (accuracy: number) => {
  // Create a DOM element for the custom marker
  const el = document.createElement('div');
  el.className = 'relative';
  
  // Create the main marker dot
  const dot = document.createElement('div');
  dot.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg';
  
  // Create the accuracy circle with dynamic size
  const circle = document.createElement('div');
  const circleSize = Math.min(Math.max(accuracy / 5, 16), 100); // Min 16px, Max 100px
  circle.style.width = `${circleSize}px`;
  circle.style.height = `${circleSize}px`;
  circle.style.position = 'absolute';
  circle.style.left = `${-circleSize/2 + 8}px`; // Center relative to dot
  circle.style.top = `${-circleSize/2 + 8}px`;
  circle.className = 'absolute rounded-full bg-blue-500/20 animate-pulse';
  
  // Add elements to the marker container
  el.appendChild(circle);
  el.appendChild(dot);

  return el;
};
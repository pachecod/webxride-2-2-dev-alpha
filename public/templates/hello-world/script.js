document.getElementById('btn').addEventListener('click', () => {
  const out = document.getElementById('out');
  const now = new Date().toLocaleTimeString();
  out.textContent = `Button clicked at ${now}`;
});



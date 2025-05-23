document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settingsForm');
  const result = document.getElementById('settingsResult');
  // Load current settings
  const res = await fetch('/api/settings');
  if (res.ok) {
    const data = await res.json();
    form.smtp_host.value = data.smtp_host || '';
    form.smtp_port.value = data.smtp_port || '';
    form.smtp_user.value = data.smtp_user || '';
    form.smtp_pass.value = data.smtp_pass || '';
    form.smtp_enabled.checked = !!data.smtp_enabled;
    form.smtp_to.value = data.smtp_to || '';
    form.discord_webhook.value = data.discord_webhook || '';
    form.discord_enabled.checked = !!data.discord_enabled;
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = {
      smtp_host: form.smtp_host.value,
      smtp_port: form.smtp_port.value,
      smtp_user: form.smtp_user.value,
      smtp_pass: form.smtp_pass.value,
      smtp_enabled: form.smtp_enabled.checked,
      smtp_to: form.smtp_to.value,
      discord_webhook: form.discord_webhook.value,
      discord_enabled: form.discord_enabled.checked
    };
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      result.textContent = 'Settings saved!';
      result.className = 'text-success';
    } else {
      result.textContent = 'Failed to save settings.';
      result.className = 'text-error';
    }
  };
});

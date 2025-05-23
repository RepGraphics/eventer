const API_URL = 'http://localhost:8080/api/auth'; // Change if hosted elsewhere

// Only attach login form handler if it exists (login page)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include' // Important: send cookies for express-session
    });

    const data = await res.json();
    if (res.ok) {
      // No need to store token/username, session is on server
      window.location.href = '/dashboard';
    } else {
      alert(data.msg || 'Login failed');
    }
  });
}

// --- DASHBOARD PAGE LOGIC ---
if (window.location.pathname === '/dashboard') {
  // Only run after DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function() {
    // Logout button handler
    document.getElementById('logoutBtn').onclick = function() {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
        window.location.href = '/';
      });
    };
    document.getElementById('logoutBtnDrawer').onclick = function() {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
        window.location.href = '/';
      });
    };

    let currentEditId = null;
    window.openEditModal = function(event) {
      currentEditId = event.id;
      document.getElementById('edit-event-id').value = event.id;
      document.getElementById('edit-event-name').value = event.name;
      document.getElementById('edit-event-datetime').value = event.time;
      document.getElementById('edit-modal').classList.add('modal-open');
    };
    document.getElementById('close-edit-modal').onclick = function() {
      document.getElementById('edit-modal').classList.remove('modal-open');
    };
    document.getElementById('edit-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const id = document.getElementById('edit-event-id').value;
      const name = document.getElementById('edit-event-name').value;
      const time = document.getElementById('edit-event-datetime').value;
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, time })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(data.notification || 'Event updated!', 'success');
        document.getElementById('edit-modal').classList.remove('modal-open');
        renderEvents();
      } else {
        showNotification('Failed to update event.', 'error');
      }
    });

    function showNotification(message, type = 'info') {
      let toast = document.createElement('div');
      toast.className = `toast toast-${type} fixed top-4 right-4 z-50`;
      toast.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3500);
    }

    // Add filter controls above event list
    const container = document.querySelector('.container');
    let filterBar = document.getElementById('event-filter-bar');
    if (!filterBar) {
      filterBar = document.createElement('div');
      filterBar.id = 'event-filter-bar';
      filterBar.className = 'flex gap-2 mb-2 w-full max-w-2xl justify-end';
      filterBar.innerHTML = `
        <button id="filter-all" class="btn btn-soft btn-sm btn-active">All</button>
        <button id="filter-complete" class="btn btn-soft btn-success btn-sm">Complete</button>
        <button id="filter-incomplete" class="btn btn-soft btn-error btn-sm">Running/Incomplete</button>
      `;
      container.insertBefore(filterBar, document.getElementById('event-list'));
    }
    let currentFilter = 'all';
    filterBar.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll('#event-filter-bar button').forEach(btn => btn.classList.remove('btn-active'));
        e.target.classList.add('btn-active');
        if (e.target.id === 'filter-all') currentFilter = 'all';
        if (e.target.id === 'filter-complete') currentFilter = 'complete';
        if (e.target.id === 'filter-incomplete') currentFilter = 'incomplete';
        renderEvents();
      }
    });

    async function renderEvents() {
      const eventList = document.getElementById('event-list');
      // Add smooth transition for filter changes
      eventList.style.transition = 'opacity 0.3s';
      eventList.style.opacity = '0.3';
      setTimeout(() => {
        eventList.innerHTML = '';
        let res, events;
        (async () => {
          try {
            res = await fetch('/api/events');
            if (!res.ok) throw new Error('Failed to fetch events');
            events = await res.json();
            if (!Array.isArray(events)) throw new Error('Events response is not an array');
          } catch (err) {
            showNotification('Could not load events: ' + err.message, 'error');
            eventList.style.opacity = '1';
            return;
          }
          events.sort((a, b) => new Date(a.time) - new Date(b.time));
          // Filter events
          events = events.filter(event => {
            const now = new Date();
            const eventTime = new Date(event.time);
            let percent = 0;
            if (event.created_at) {
              const createdAt = new Date(event.created_at);
              const total = eventTime - createdAt;
              const elapsed = now - createdAt;
              if (total > 0) {
                percent = Math.round((elapsed / total) * 100);
                percent = Math.max(0, Math.min(100, percent));
              } else {
                percent = eventTime <= now ? 100 : 0;
              }
            } else {
              percent = eventTime <= now ? 100 : 0;
            }
            if (currentFilter === 'complete') return percent === 100;
            if (currentFilter === 'incomplete') return percent < 100;
            return true;
          });
          if (events.length === 0) {
            // Add a placeholder to keep the card height
            const placeholder = document.createElement('li');
            placeholder.className = "rounded-xl bg-base-200 shadow-none p-6 flex flex-col justify-center items-center min-h-[120px] border-dashed border-2 border-base-300 text-base-content/50";
            placeholder.innerHTML = `<span>No events to display.</span>`;
            eventList.appendChild(placeholder);
          } else {
            events.forEach(event => {
              const now = new Date();
              const eventTime = new Date(event.time);
              let percent = 0;
              if (event.created_at) {
                const createdAt = new Date(event.created_at);
                const total = eventTime - createdAt;
                const elapsed = now - createdAt;
                if (total > 0) {
                  percent = Math.round((elapsed / total) * 100);
                  percent = Math.max(0, Math.min(100, percent));
                } else {
                  percent = eventTime <= now ? 100 : 0;
                }
              } else {
                percent = eventTime <= now ? 100 : 0;
              }
              // Set progress color
              let progressColor;
              if (percent === 100) {
                progressColor = 'text-success';
              } else if (percent >= 50) {
                progressColor = 'text-warning';
              } else {
                progressColor = 'text-error';
              }
              const listItem = document.createElement('li');
              listItem.className = "rounded-xl bg-base-200 shadow-lg p-6 flex flex-col justify-between min-h-[120px] card card-border border-base-300 bg-base-100 shadow-md hover:shadow-xl transition-all";
              listItem.innerHTML = `
                <div class="mb-4 flex items-center gap-4">
                  <div class="radial-progress ${progressColor}" style="--value:${percent};--size:3rem;" role="progressbar">${percent}</div>
                  <div>
                    <span class="block font-bold text-lg text-white">${event.name}</span>
                    <span class="block text-base-content/70 text-sm mt-1">${new Date(event.time).toLocaleString()}</span>
                  </div>
                </div>
                <div class="flex gap-2 mt-auto">
                  <button class="btn btn-soft btn-secondary edit-btn">Edit</button>
                  <button class="btn btn-soft btn-error delete-btn">Delete</button>
                </div>
              `;
              listItem.querySelector('.edit-btn').addEventListener('click', () => {
                window.openEditModal(event);
              });
              listItem.querySelector('.delete-btn').addEventListener('click', async () => {
                // Add confirm delete modal to DOM (if not present)
                let confirmModal = document.getElementById('confirm-delete-modal');
                if (!confirmModal) {
                  confirmModal = document.createElement('div');
                  confirmModal.id = 'confirm-delete-modal';
                  confirmModal.className = 'modal';
                  confirmModal.innerHTML = `
                    <div class="modal-box">
                      <h3 class="font-bold text-lg">Confirm Delete</h3>
                      <p class="py-4">This event is not complete. Are you sure you want to delete it?</p>
                      <div class="modal-action">
                        <button id="confirm-delete-btn" class="btn btn-soft btn-error">Delete</button>
                        <button id="cancel-delete-btn" class="btn btn-soft">Cancel</button>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(confirmModal);
                }
                let pendingDelete = null;
                if (percent < 100) {
                  // Show confirm modal
                  confirmModal.classList.add('modal-open');
                  pendingDelete = async () => {
                    const deleteRes = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
                    if (deleteRes.ok) {
                      const data = await deleteRes.json();
                      showNotification(data.notification || 'Event deleted!', 'success');
                      listItem.remove();
                    } else {
                      showNotification('Failed to delete event.', 'error');
                    }
                    confirmModal.classList.remove('modal-open');
                    pendingDelete = null;
                  };
                } else {
                  // Delete immediately if 100%
                  const deleteRes = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
                  if (deleteRes.ok) {
                    const data = await deleteRes.json();
                    showNotification(data.notification || 'Event deleted!', 'success');
                    listItem.remove();
                  } else {
                    showNotification('Failed to delete event.', 'error');
                  }
                }
                // Confirm/cancel modal handlers
                document.body.addEventListener('click', function(e) {
                  if (e.target && e.target.id === 'confirm-delete-btn' && pendingDelete) {
                    pendingDelete();
                  }
                  if (e.target && e.target.id === 'cancel-delete-btn') {
                    document.getElementById('confirm-delete-modal').classList.remove('modal-open');
                    pendingDelete = null;
                  }
                });
              });
              eventList.appendChild(listItem);
            });
          }
          eventList.style.opacity = '1';
        })();
      }, 150);
    }

    renderEvents();

    document.getElementById('event-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const event = {
        name: document.getElementById('event-name').value,
        time: document.getElementById('event-datetime').value,
      };
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      const data = await res.json();
      showNotification(data.notification || 'Event added!', 'success');
      if (res.ok) {
        renderEvents();
        e.target.reset();
      } else {
        showNotification(data.error || 'Error', 'error');
      }
    });

    // Expand/collapse the create event dropdown on button click
    const createEventBtn = document.getElementById('create-event-btn');
    const createEventToggle = document.getElementById('create-event-toggle');
    if (createEventBtn && createEventToggle) {
      createEventBtn.addEventListener('click', function(e) {
        e.preventDefault();
        createEventToggle.checked = !createEventToggle.checked;
      });
    }
  });
}

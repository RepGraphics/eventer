// Only attach login form handler if it exists (login page)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const res = await fetch(`/api/auth/login`, {
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

    // Fetch categories and render category UI
    async function renderCategories() {
      const res = await fetch('/api/events/categories');
      const cats = await res.json();
      let catBar = document.getElementById('category-bar');
      if (!catBar) {
        catBar = document.createElement('div');
        catBar.id = 'category-bar';
        catBar.className = 'flex flex-col gap-2 mb-4 w-full max-w-2xl';
        const container = document.querySelector('.container');
        const filterBar = document.getElementById('event-filter-bar');
        container.insertBefore(catBar, filterBar);
      }
      // Category management section: badges with delete, and add form
      let badgesDiv = catBar.querySelector('.category-badges');
      if (!badgesDiv) {
        badgesDiv = document.createElement('div');
        badgesDiv.className = 'category-badges flex flex-wrap gap-2 mb-2';
        catBar.appendChild(badgesDiv);
      }
      badgesDiv.innerHTML = cats.filter(cat => cat).map(cat =>
        `<span class="badge badge-lg badge-primary flex items-center gap-1">${cat}
          <button type="button" class="ml-1 text-xs text-error delete-cat-btn" data-cat="${cat}" title="Delete category">✕</button>
        </span>`
      ).join(' ');
      // Attach delete handlers
      badgesDiv.querySelectorAll('.delete-cat-btn').forEach(btn => {
        btn.onclick = async (e) => {
          const cat = btn.getAttribute('data-cat');
          if (!cat) return;
          // Custom modal confirm for category deletion
          let catModal = document.getElementById('confirm-delete-category-modal');
          if (!catModal) {
            catModal = document.createElement('div');
            catModal.id = 'confirm-delete-category-modal';
            catModal.className = 'modal';
            catModal.innerHTML = `
              <div class="modal-box">
                <h3 class="font-bold text-lg">Delete Category</h3>
                <p class="py-4" id="delete-category-modal-msg"></p>
                <div class="modal-action">
                  <button id="confirm-delete-category-btn" class="btn btn-soft btn-error">Delete</button>
                  <button id="cancel-delete-category-btn" class="btn btn-soft">Cancel</button>
                </div>
              </div>
            `;
            document.body.appendChild(catModal);
          }
          // Set message
          document.getElementById('delete-category-modal-msg').textContent = `Delete category '${cat}'? Events will become uncategorized.`;
          catModal.classList.add('modal-open');
          // Remove previous listeners
          const newConfirm = catModal.querySelector('#confirm-delete-category-btn').cloneNode(true);
          const newCancel = catModal.querySelector('#cancel-delete-category-btn').cloneNode(true);
          catModal.querySelector('#confirm-delete-category-btn').replaceWith(newConfirm);
          catModal.querySelector('#cancel-delete-category-btn').replaceWith(newCancel);
          // Confirm
          newConfirm.onclick = async () => {
            const res = await fetch(`/api/events/categories/${encodeURIComponent(cat)}`, { method: 'DELETE' });
            if (res.ok) {
              showNotification('Category deleted!', 'success');
              renderEvents();
            } else {
              showNotification('Failed to delete category', 'error');
            }
            catModal.classList.remove('modal-open');
          };
          // Cancel
          newCancel.onclick = () => {
            catModal.classList.remove('modal-open');
          };
        };
      });
      // Remove any duplicate forms
      catBar.querySelectorAll('form#add-category-form').forEach((form, idx) => { if (idx > 0) form.remove(); });
      let addCatForm = document.getElementById('add-category-form');
      if (!addCatForm) {
        addCatForm = document.createElement('form');
        addCatForm.id = 'add-category-form';
        addCatForm.className = 'flex gap-2 mt-2';
        addCatForm.innerHTML = `
          <input type="text" id="new-category-name" class="input input-bordered input-sm" placeholder="New category" required />
          <button type="submit" class="btn btn-soft btn-primary btn-sm">Add</button>
        `;
        addCatForm.onsubmit = async (e) => {
          e.preventDefault();
          const name = document.getElementById('new-category-name').value.trim();
          if (!name) return;
          const res = await fetch('/api/events/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          });
          if (res.ok) {
            showNotification('Category added!', 'success');
            renderEvents();
          } else {
            const data = await res.json();
            showNotification(data.error || 'Failed to add category', 'error');
          }
          addCatForm.reset();
        };
        catBar.appendChild(addCatForm);
      } else {
        if (catBar.lastElementChild !== addCatForm) {
          catBar.appendChild(addCatForm);
        }
      }
      // Save categories for use in event form
      window._eventer_categories = cats.filter(cat => cat);
    }

    // Add category dropdown to Create an Event form ONLY if categories exist
    const eventForm = document.getElementById('event-form');
    async function updateEventFormCategoryDropdown() {
      if (!eventForm) return;
      // Remove old dropdown if present
      const oldSelect = document.getElementById('event-category');
      if (oldSelect) oldSelect.remove();
      const cats = window._eventer_categories || [];
      if (cats.length === 0) return; // No dropdown if no categories
      const catSelect = document.createElement('select');
      catSelect.id = 'event-category';
      catSelect.className = 'select select-bordered w-full mb-4 mt-4'; // Added mt-4 for more top margin
      catSelect.innerHTML = '<option value="">(Uncategorized)</option>';
      cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
      const dtInput = eventForm.querySelector('#event-datetime');
      if (dtInput && dtInput.parentNode === eventForm && dtInput.nextSibling) {
        eventForm.insertBefore(catSelect, dtInput.nextSibling);
      } else {
        eventForm.appendChild(catSelect);
      }
    }

    // Patch submit to include category
    if (eventForm) {
      const origSubmit = eventForm.onsubmit;
      eventForm.onsubmit = async function(e) {
        e.preventDefault();
        const event = {
          name: document.getElementById('event-name').value,
          time: document.getElementById('event-datetime').value,
          category: (document.getElementById('event-category') && document.getElementById('event-category').value) || ''
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
          eventForm.reset();
        } else {
          showNotification('Failed to add event.', 'error');
        }
      };
    }

    // Call updateEventFormCategoryDropdown after categories are rendered
    async function renderEvents() {
      const eventList = document.getElementById('event-list');
      eventList.style.transition = 'opacity 0.3s';
      eventList.style.opacity = '0.3';
      setTimeout(async () => {
        eventList.innerHTML = '';
        await renderCategories();
        await updateEventFormCategoryDropdown();
        // Add select all checkbox
        const selectAllDiv = document.createElement('div');
        selectAllDiv.className = "flex items-center mb-2";
        selectAllDiv.innerHTML = `<input type="checkbox" id="select-all-events" class="checkbox mr-2" /> <span>Select All</span>`;
        eventList.appendChild(selectAllDiv);
        document.getElementById('select-all-events').addEventListener('change', function() {
          document.querySelectorAll('.event-checkbox').forEach(cb => cb.checked = this.checked);
          updateBulkDeleteBtn();
        });
        function updateBulkDeleteBtn() {
          const checked = document.querySelectorAll('.event-checkbox:checked').length;
          document.getElementById('bulk-delete-btn').disabled = checked === 0;
        }
        let res, events;
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
        // Group events by category
        const grouped = {};
        events.forEach(event => {
          const cat = event.category || '';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(event);
        });
        // Fetch all categories
        let cats = [];
        try {
          const catRes = await fetch('/api/events/categories');
          cats = await catRes.json();
        } catch (e) {}
        // Render all categories as drop targets (even if empty)
        cats.filter(cat => cat).forEach(cat => {
          const catHeader = document.createElement('div');
          catHeader.className = 'font-bold text-lg mt-4 mb-2 text-primary droppable-category';
          catHeader.textContent = cat;
          makeCategoryDroppable(catHeader, cat);
          eventList.appendChild(catHeader);
          (grouped[cat] || []).forEach(event => {
            renderEventListItem(event, updateBulkDeleteBtn, eventList);
          });
        });
        // Always show uncategorized group as drop target
        const catHeader = document.createElement('div');
        catHeader.className = 'font-bold text-lg mt-4 mb-2 text-primary droppable-category';
        catHeader.textContent = '(Uncategorized)';
        makeCategoryDroppable(catHeader, '');
        eventList.appendChild(catHeader);
        (grouped[''] || []).forEach(event => {
          renderEventListItem(event, updateBulkDeleteBtn, eventList);
        });
        eventList.style.opacity = '1';
      }, 150);
    }

    // Helper to render a single event list item
    function renderEventListItem(event, updateBulkDeleteBtn, eventList) {
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
        <div class="flex items-center gap-2 mb-4">
          <input type="checkbox" class="event-checkbox checkbox mr-2" data-id="${event.id}" />
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
      listItem.querySelector('.event-checkbox').addEventListener('change', updateBulkDeleteBtn);
      listItem.setAttribute('draggable', 'true');
      listItem.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', event.id);
        e.dataTransfer.effectAllowed = 'move';
        listItem.classList.add('opacity-50');
      };
      listItem.ondragend = () => {
        listItem.classList.remove('opacity-50');
      };
      eventList.appendChild(listItem);
    }

    // Drag-and-drop support for moving events between categories
    function makeCategoryDroppable(element, category) {
      element.ondragover = (e) => {
        e.preventDefault();
        element.classList.add('bg-primary/10', 'border-2', 'border-primary');
      };
      element.ondragleave = () => {
        element.classList.remove('bg-primary/10', 'border-2', 'border-primary');
      };
      element.ondrop = async (e) => {
        e.preventDefault();
        element.classList.remove('bg-primary/10', 'border-2', 'border-primary');
        const eventId = e.dataTransfer.getData('text/plain');
        if (!eventId) return;
        // Move event to this category
        const res = await fetch(`/api/events/${eventId}/category`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category })
        });
        if (res.ok) {
          showNotification('Event moved!', 'success');
          renderEvents();
        } else {
          showNotification('Failed to move event', 'error');
        }
      };
    }

    renderEvents();
  });
}

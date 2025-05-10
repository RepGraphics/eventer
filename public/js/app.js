const API_URL = 'http://localhost:8080/api/auth'; // Change if hosted elsewhere

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard';
  } else {
    alert(data.msg || 'Login failed');
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('event-form');
    const eventList = document.getElementById('event-list');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editEventName = document.getElementById('edit-event-name');
    const editEventTime = document.getElementById('edit-event-time');
    let currentEditId = null;

    // Fetch and display events
    const fetchEvents = async () => {
        const response = await fetch('/api/events');
        const events = await response.json();
        eventList.innerHTML = '';
        events.forEach(event => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${event.name} - ${event.time}</span>
                <button class="btn btn-sm btn-primary" onclick="openEditModal(${event.id}, '${event.name}', '${event.time}')">Edit</button>
                <button class="btn btn-sm btn-error" onclick="deleteEvent(${event.id})">Delete</button>
            `;
            eventList.appendChild(li);
        });
    };

    // Add event
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('event-name').value;
        const time = document.getElementById('event-time').value;
        await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, time })
        });
        eventForm.reset();
        fetchEvents();
    });

    // Open edit modal
    window.openEditModal = (id, name, time) => {
        currentEditId = id;
        editEventName.value = name;
        editEventTime.value = time;
        editModal.classList.add('modal-open');
    };

    // Edit event
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = editEventName.value;
        const time = editEventTime.value;
        await fetch(`/api/events/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, time })
        });
        editModal.classList.remove('modal-open');
        fetchEvents();
    });

    // Delete event
    window.deleteEvent = async (id) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await fetch(`/api/events/${id}`, { method: 'DELETE' });
            fetchEvents();
        }
    };

    fetchEvents();
});

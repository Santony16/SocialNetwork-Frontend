/**
 * API functions for managing posting schedules
 */
const API_URL = 'http://localhost:3001/api';

/**
 * Get auth token from sessionStorage
 */
function getToken() {
  return sessionStorage.getItem('authToken');
}

/**
 * Get all schedule slots for the current user
 * @returns {Promise<Array>} Schedule slots data
 */
async function fetchSchedule() {
  try {
    const token = getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_URL}/schedule`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch schedule');

    console.log('Fetched schedules:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

/**
 * Add a new schedule slot
 */
async function addScheduleSlot(dayOfWeek, timeOfDay) {
  try {
    const token = getToken();
    if (!token) throw new Error('Authentication required');

    console.log(`Adding schedule slot: day=${dayOfWeek}, time=${timeOfDay}`);
    
    const response = await fetch(`${API_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ day_of_week: Number(dayOfWeek), time_of_day: timeOfDay })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add schedule slot');

    console.log('Added schedule slot:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error adding schedule slot:', error);
    throw error;
  }
}

/**
 * Delete a schedule slot
 */
async function deleteScheduleSlot(id) {
  try {
    const token = getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_URL}/schedule/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete schedule slot');

    return data;
  } catch (error) {
    console.error('Error deleting schedule slot:', error);
    throw error;
  }
}

/**
 * Create a scheduled post
 */
async function createScheduledPost(postData) {
  try {
    const token = getToken();
    if (!token) throw new Error('Authentication required');

    // Ensure the day is properly converted to a number
    const scheduleDay = Number(postData.scheduleDay);
    console.log(`Creating scheduled post with day=${scheduleDay} (${typeof scheduleDay}), time=${postData.scheduleTime}`);
    
    const formData = new FormData();
    formData.append('content', postData.content);
    formData.append('networks', JSON.stringify(postData.networks));
    formData.append('publishOption', 'schedule');
    formData.append('scheduleDay', scheduleDay.toString()); // Ensure it's a string for FormData
    formData.append('scheduleTime', postData.scheduleTime);

    if (postData.mediaFile) {
      formData.append('media', postData.mediaFile);
    }

    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();
    console.log('Schedule post response:', data);
    
    if (!response.ok) throw new Error(data.message || 'Failed to create scheduled post');

    return data.post;
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    throw error;
  }
}

// Expose API
window.scheduleAPI = {
  fetchSchedule,
  addScheduleSlot,
  deleteScheduleSlot,
  createScheduledPost
};

/* ---------------- UI HELPERS ---------------- */

// Load all schedules on page load
document.addEventListener('DOMContentLoaded', function() {
  // If we're on the schedule page, initialize the UI
  if (document.querySelector('.schedule-grid')) {
    initializeScheduleUI();
  }
});

async function initializeScheduleUI() {
  try {
    // Fetch current schedule
    const schedules = await fetchSchedule();
    
    if (schedules && schedules.length > 0) {
      // Clear any example data
      clearScheduleUI();
      
      // Add each schedule to the UI
      schedules.forEach(schedule => {
        addScheduleToUI(schedule);
      });
    }
  } catch (error) {
    console.error('Error initializing schedule UI:', error);
    showNotification('Failed to load your schedule. Please try again.', 'error');
  }
}

function clearScheduleUI() {
  const dayColumns = document.querySelectorAll('.day-times');
  dayColumns.forEach(column => {
    // Remove all time slots but keep the "Add Time" button
    const addTimeBtn = column.querySelector('.add-time-to-day');
    const timeSlots = column.querySelectorAll('.time-slot');
    
    timeSlots.forEach(slot => slot.remove());
    
    // If there's a "No times scheduled" message, remove it
    const emptyMessage = column.querySelector('.flex.items-center.justify-center');
    if (emptyMessage) {
      emptyMessage.remove();
    }
    
    // Ensure the "Add Time" button is the last child
    if (addTimeBtn && addTimeBtn.parentNode === column) {
      column.appendChild(addTimeBtn);
    }
  });
}

function addScheduleToUI(schedule) {
  const dayIndex = schedule.day_of_week;
  
  // JavaScript day indexes: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // But our UI might be laid out differently
  const dayColumns = document.querySelectorAll('.day-column');
  
  // Find the right column based on the header text
  let targetColumn = null;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  dayColumns.forEach(column => {
    const header = column.querySelector('.day-header h4');
    if (header && header.textContent === dayNames[dayIndex]) {
      targetColumn = column;
    }
  });
  
  if (!targetColumn) {
    console.error('Could not find column for day:', dayNames[dayIndex]);
    return;
  }
  
  // Format the time for display
  const timeStr = schedule.time_of_day;
  const formattedTime = formatTimeString(timeStr);
  
  // Create a time slot element
  const timeSlot = document.createElement('div');
  timeSlot.className = 'time-slot bg-white border border-emerald-200 rounded-lg p-3 mb-2 flex items-center justify-between hover:border-emerald-400 transition-colors';
  timeSlot.innerHTML = `
    <span class="text-gray-700" data-raw-time="${timeStr}">${formattedTime}</span>
    <button class="delete-time text-gray-400 hover:text-red-500" data-schedule-id="${schedule.id}">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add click handler to delete button
  const deleteBtn = timeSlot.querySelector('.delete-time');
  deleteBtn.addEventListener('click', async function() {
    const scheduleId = this.getAttribute('data-schedule-id');
    if (confirm('Are you sure you want to delete this time slot?')) {
      try {
        await deleteScheduleSlot(scheduleId);
        timeSlot.remove();
        showNotification('Time slot deleted successfully', 'success');
      } catch (error) {
        showNotification('Failed to delete time slot', 'error');
      }
    }
  });
  
  // Find the container to add the time slot
  const timesContainer = targetColumn.querySelector('.day-times');
  
  // Remove any "No times scheduled" message
  const emptyMessage = timesContainer.querySelector('.flex.items-center.justify-center');
  if (emptyMessage) {
    emptyMessage.remove();
  }
  
  // Add the time slot before the "Add Time" button
  const addTimeBtn = timesContainer.querySelector('.add-time-to-day');
  if (addTimeBtn) {
    timesContainer.insertBefore(timeSlot, addTimeBtn);
  } else {
    timesContainer.appendChild(timeSlot);
  }
}

/**
 * Format time string (e.g., "14:30:00" -> "2:30 PM")
 */
function formatTimeString(timeStr) {
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    return timeStr;
  }
}

/**
 * Show notification (success, error, info)
 */
function showNotification(message, type = 'info') {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  notification.className = `p-4 rounded-lg shadow-lg flex items-center ${
    type === 'success'
      ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
      : type === 'error'
      ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
      : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
  } min-w-[300px]`;

  notification.innerHTML = `
      <i class="mr-2 ${
        type === 'success'
          ? 'fas fa-check-circle text-green-500'
          : type === 'error'
          ? 'fas fa-exclamation-circle text-red-500'
          : 'fas fa-info-circle text-blue-500'
      }"></i>
      <span>${message}</span>
      <button class="ml-auto text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
      </button>
  `;

  notification.querySelector('button').addEventListener('click', () => {
    notification.remove();
  });

  container.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

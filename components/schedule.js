/**
 * Schedule component handling
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const addTimeBtn = document.getElementById('add-time-btn');
  const addTimeModal = document.getElementById('add-time-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const cancelAddTimeBtn = document.getElementById('cancel-add-time');
  const addTimeForm = document.getElementById('add-time-form');
  const daySelect = document.getElementById('day-select');
  const timeInput = document.getElementById('time-input');
  
  // Day names mapping (for display)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Initialize the schedule
  initializeSchedule();
  
  // Add event listeners for modal
  if (addTimeBtn) {
    addTimeBtn.addEventListener('click', () => {
      addTimeModal.classList.remove('hidden');
    });
  }
  
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }
  
  if (cancelAddTimeBtn) {
    cancelAddTimeBtn.addEventListener('click', closeModal);
  }
  
  // Add event listener for day-specific "Add Time" buttons
  document.querySelectorAll('.add-time-to-day').forEach(button => {
    button.addEventListener('click', function() {
      const dayColumn = this.closest('.day-column');
      const dayIndex = Array.from(dayColumn.parentNode.children).indexOf(dayColumn);
      
      // Set the day in the form and open the modal
      daySelect.value = dayIndex === 6 ? 0 : dayIndex + 1; // Adjust for Sunday being 0
      addTimeModal.classList.remove('hidden');
    });
  });
  
  // Add event listener for the form submission
  if (addTimeForm) {
    addTimeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const dayOfWeek = parseInt(daySelect.value);
      const timeOfDay = timeInput.value;
      
      if (dayOfWeek === undefined || !timeOfDay) {
        showNotification('Please select both day and time', 'error');
        return;
      }
      
      try {
        // Call the API function from schedule.js
        await window.scheduleAPI.addScheduleSlot(dayOfWeek, timeOfDay);
        showNotification('Schedule slot added successfully', 'success');
        closeModal();
        refreshSchedule();
      } catch (error) {
        console.error('Error adding schedule slot:', error);
        showNotification(error.message, 'error');
      }
    });
  }
  
  // Function to initialize the schedule UI
  async function initializeSchedule() {
    try {
      const scheduleData = await window.scheduleAPI.fetchSchedule();
      displaySchedule(scheduleData);
    } catch (error) {
      console.error('Error initializing schedule:', error);
      showNotification('Failed to load schedule', 'error');
    }
  }
  
  // Function to display schedule data in the UI
  function displaySchedule(scheduleData) {
    // Clear existing time slots (except the "Add Time" buttons)
    document.querySelectorAll('.day-times').forEach(dayContainer => {
      const addButton = dayContainer.querySelector('.add-time-to-day');
      dayContainer.innerHTML = '';
      if (addButton) {
        dayContainer.appendChild(addButton);
      }
    });
    
    // Group schedule by day of week
    const scheduleByDay = {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []};
    
    scheduleData.forEach(slot => {
      const day = parseInt(slot.day_of_week);
      if (scheduleByDay[day]) {
        scheduleByDay[day].push(slot);
      }
    });
    
    // Display schedule for each day
    const dayColumns = document.querySelectorAll('.day-column');
    
    dayColumns.forEach((column, index) => {
      // Map column index to day of week (assuming Monday is first)
      const dayOfWeek = index === 6 ? 0 : index + 1;
      
      const dayTimes = column.querySelector('.day-times');
      const slots = scheduleByDay[dayOfWeek] || [];
      
      // Sort slots by time
      slots.sort((a, b) => {
        return a.time_of_day.localeCompare(b.time_of_day);
      });
      
      if (slots.length === 0) {
        // If no times, show empty state
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'flex items-center justify-center h-full text-gray-500 text-sm';
        emptyMessage.textContent = 'No times scheduled';
        dayTimes.insertBefore(emptyMessage, dayTimes.lastChild);
      } else {
        // Add each time slot to the day column
        slots.forEach(slot => {
          const timeSlot = document.createElement('div');
          timeSlot.className = 'time-slot bg-white border border-emerald-200 rounded-lg p-3 mb-2 flex items-center justify-between hover:border-emerald-400 transition-colors';
          timeSlot.dataset.id = slot.id;
          
          // Format the time
          const timeDisplay = formatTimeString(slot.time_of_day);
          
          timeSlot.innerHTML = `
            <span class="text-gray-700">${timeDisplay}</span>
            <button class="delete-time text-gray-400 hover:text-red-500">
              <i class="fas fa-times"></i>
            </button>
          `;
          
          dayTimes.insertBefore(timeSlot, dayTimes.lastChild);
        });
      }
    });
    
    // Re-attach event listeners
    setupDeleteButtons();
  }
  
  // Function to format time string (e.g., "14:30:00" -> "2:30 PM")
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
  
  // Setup event listeners for delete buttons
  function setupDeleteButtons() {
    document.querySelectorAll('.delete-time').forEach(button => {
      button.addEventListener('click', async function() {
        const timeSlot = this.closest('.time-slot');
        const id = timeSlot.dataset.id;
        
        if (confirm('Are you sure you want to delete this time slot?')) {
          try {
            await window.scheduleAPI.deleteScheduleSlot(id);
            timeSlot.remove();
            
            // If no more time slots, show empty message
            const dayTimes = this.closest('.day-times');
            const remainingSlots = dayTimes.querySelectorAll('.time-slot');
            
            if (remainingSlots.length === 0) {
              const emptyMessage = document.createElement('div');
              emptyMessage.className = 'flex items-center justify-center h-full text-gray-500 text-sm';
              emptyMessage.textContent = 'No times scheduled';
              dayTimes.insertBefore(emptyMessage, dayTimes.lastChild);
            }
            
            showNotification('Time slot deleted successfully', 'success');
          } catch (error) {
            console.error('Error deleting schedule slot:', error);
            showNotification('Failed to delete time slot', 'error');
          }
        }
      });
    });
  }
  
  // Function to close the modal
  function closeModal() {
    addTimeModal.classList.add('hidden');
    addTimeForm.reset();
  }
  
  // Refresh the schedule
  function refreshSchedule() {
    initializeSchedule();
  }
  
  // Make the refresh function available globally
  window.refreshSchedule = refreshSchedule;
  
  // Show notification function
  function showNotification(message, type = 'info') {
    // Check for existing notification container
    let container = document.getElementById('notification-container');
    
    // Create container if it doesn't exist
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2';
      document.body.appendChild(container);
    }
    
    // Create notification element
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
    
    // Add click listener to close button
    notification.querySelector('button').addEventListener('click', () => {
      notification.remove();
    });
    
    // Add to container
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
});

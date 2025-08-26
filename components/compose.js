document.addEventListener('DOMContentLoaded', function() {
    console.log("Compose script loaded");
    
    // Get elements
    const postContent = document.getElementById('post-content');
    const charCount = document.getElementById('char-count');
    const counterDisplay = document.getElementById('character-counter');
    const publishOptions = document.querySelectorAll('input[name="publish-option"]');
    const scheduleDateTime = document.getElementById('schedule-datetime');
    const queueDetails = document.getElementById('queue-details');
    const useSpecificSlot = document.getElementById('use-specific-slot');
    const specificSlotSelector = document.getElementById('specific-slot-selector');
    const previewContent = document.getElementById('preview-content');
    const attachMediaBtn = document.getElementById('attach-media-btn');
    const mediaUpload = document.getElementById('media-upload');
    const mediaPreview = document.getElementById('media-preview');
    const mediaPreviewImage = document.getElementById('media-preview-image');
    const removeMediaBtn = document.getElementById('remove-media');
    const previewMedia = document.getElementById('preview-media');
    const previewMediaImg = document.getElementById('preview-media-img');
    const composeForm = document.getElementById('compose-form');
    
    // Character limits
    const WARNING_THRESHOLD = 450;
    const DANGER_THRESHOLD = 480;
    const MAX_CHARS = 500;
    
    // Handle character counting
    if (postContent) {
        postContent.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            
            // Update preview
            updatePreview();
            
            // Update counter color based on remaining characters
            if (length > DANGER_THRESHOLD) {
                counterDisplay.className = 'text-sm font-medium text-gray-500 danger';
            } else if (length > WARNING_THRESHOLD) {
                counterDisplay.className = 'text-sm font-medium text-gray-500 warning';
            } else {
                counterDisplay.className = 'text-sm font-medium text-gray-500';
            }
            
            // Prevent typing more than max characters
            if (length > MAX_CHARS) {
                this.value = this.value.substring(0, MAX_CHARS);
                charCount.textContent = MAX_CHARS;
            }
        });
    }
    
    // Handle publish options
    publishOptions.forEach(option => {
        option.addEventListener('change', function() {
            // Hide all conditional sections first
            if (scheduleDateTime) scheduleDateTime.classList.add('hidden');
            if (queueDetails) queueDetails.classList.add('hidden');
            
            // Show the appropriate section based on selected option
            if (this.value === 'schedule' && scheduleDateTime) {
                scheduleDateTime.classList.remove('hidden');
            } else if (this.value === 'queue' && queueDetails) {
                queueDetails.classList.remove('hidden');
            }
        });
    });
    
    // Handle specific time slot selection for queue
    if (useSpecificSlot) {
        useSpecificSlot.addEventListener('change', function() {
            if (this.checked) {
                specificSlotSelector.classList.remove('hidden');
            } else {
                specificSlotSelector.classList.add('hidden');
            }
        });
    }
    
    // Load schedule slots (would be populated from the API in a real implementation)
    function loadScheduleSlots() {
    }
    
    // Call this function to load the schedule slots when needed
    if (document.getElementById('schedule-slot')) {
        loadScheduleSlots();
    }
    
    // Handle media upload
    if (attachMediaBtn && mediaUpload) {
        attachMediaBtn.addEventListener('click', function() {
            mediaUpload.click();
        });
        
        mediaUpload.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Only accept images for now
                if (!file.type.match('image.*')) {
                    showToast('Only image files are supported.', 'error');
                    return;
                }
                
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size too large. Maximum size is 5MB.', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    mediaPreviewImage.src = e.target.result;
                    mediaPreview.classList.remove('hidden');
                    
                    // Update preview
                    previewMediaImg.src = e.target.result;
                    previewMedia.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle media removal
    if (removeMediaBtn) {
        removeMediaBtn.addEventListener('click', function() {
            mediaPreview.classList.add('hidden');
            mediaPreviewImage.src = '';
            mediaUpload.value = '';
            
            // Update preview
            previewMedia.classList.add('hidden');
            previewMediaImg.src = '';
        });
    }
    
    // Update preview when typing
    function updatePreview() {
        if (!previewContent) return;
        
        const content = postContent.value.trim();
        
        if (content) {
            previewContent.innerHTML = content.replace(/\n/g, '<br>');
        } else {
            previewContent.innerHTML = '<p class="text-gray-400 italic">Your post preview will appear here</p>';
        }
    }
    
    // load schedule options
    const scheduleDaySelect = document.getElementById('schedule-day');
    const scheduleTimeSelect = document.getElementById('schedule-time');
    
    if (scheduleDaySelect && scheduleTimeSelect && document.getElementById('schedule-datetime')) {
        loadDaysAndHoursOptions();
    }

    // Load days and hours options
    async function loadDaysAndHoursOptions() {
        try {
            const response = await fetch('http://localhost:3001/api/schedule/options');
            const data = await response.json();
            
            if (data.success && data.data) {
                // Load days
                if (data.data.days && Array.isArray(data.data.days)) {
                    scheduleDaySelect.innerHTML = '<option value="">Select a day</option>';
                    data.data.days.forEach(day => {
                        const option = document.createElement('option');
                        option.value = day.value;
                        option.textContent = day.label;
                        scheduleDaySelect.appendChild(option);
                    });
                }
                
                // Load hours
                if (data.data.hours && Array.isArray(data.data.hours)) {
                    scheduleTimeSelect.innerHTML = '<option value="">Select a time</option>';
                    data.data.hours.forEach(hour => {
                        const option = document.createElement('option');
                        option.value = hour.value;
                        option.textContent = hour.label;
                        scheduleTimeSelect.appendChild(option);
                    });
                }
                
                // Show timezone
                if (data.data.timezone) {
                    const timezoneInfo = document.createElement('div');
                    timezoneInfo.className = 'text-xs text-gray-500 mt-1';
                    timezoneInfo.textContent = `Timezone: ${data.data.timezone}`;
                    scheduleTimeSelect.parentNode.appendChild(timezoneInfo);
                }
            }
        } catch (error) {
            console.error('Error loading schedule options:', error);
        }
    }
    
    // Form submission
    if (composeForm) {
        composeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const postContent = document.getElementById('post-content').value.trim();
            const mediaUpload = document.getElementById('media-upload');
            const mediaFile = mediaUpload.files[0];
            
            // Get selected social networks
            const selectedNetworks = [];
            document.querySelectorAll('input[name="social_network"]:checked').forEach(network => {
                selectedNetworks.push(network.value);
            });
            
            if (selectedNetworks.length === 0) {
                showToast('Please select at least one social network', 'error');
                return;
            }
            
            if (!postContent && !mediaFile) {
                showToast('Please enter content or add media', 'error');
                return;
            }
            
            // Get publishing option
            const selectedPublishOption = document.querySelector('input[name="publish-option"]:checked').value;
            
            // Create FormData object - moved this up before any references to it
            const formData = new FormData();
            formData.append('content', postContent);
            formData.append('networks', JSON.stringify(selectedNetworks));
            formData.append('publishOption', selectedPublishOption);
            
            // Add schedule details if scheduling
            if (selectedPublishOption === 'schedule') {
                const scheduleDay = document.getElementById('schedule-day').value;
                const scheduleTime = document.getElementById('schedule-time').value;
                
                if (!scheduleDay || !scheduleTime) {
                    showToast('Please select day and time to schedule', 'error');
                    return;
                }
                
                // Convert to numeric value to ensure correct handling
                const dayValue = Number(scheduleDay);
                console.log(`Scheduling for day ${dayValue} (${typeof dayValue}) at ${scheduleTime}`);
                
                formData.append('scheduleDay', dayValue.toString());
                formData.append('scheduleTime', scheduleTime);
            }
            
            // Add media if present
            if (mediaFile) {
                console.log('Adding media file:', mediaFile.name, mediaFile.type, mediaFile.size);
                formData.append('media', mediaFile);
            }
            
            // Disable submit button and show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Publishing...';
            
            try {
                const token = sessionStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Authentication required. Please log in again.');
                }
                
                console.log('Sending post with networks:', selectedNetworks);
                console.log('Publish option:', selectedPublishOption);
                
                if (selectedPublishOption === 'schedule') {
                    console.log('Schedule data:', {
                        day: formData.get('scheduleDay'),
                        time: formData.get('scheduleTime')
                    });
                }
                
                // Send the request
                const response = await fetch('http://localhost:3001/api/posts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                // Parse the response
                const data = await response.json();
                console.log('Server response:', data);
                
                if (response.ok && data.success) {
                    // Show success message
                    if (selectedPublishOption === 'now') {
                        showToast('Post published successfully!', 'success');
                    } else {
                        showToast('Post scheduled successfully!', 'success');
                    }
                    
                    // Reset form
                    resetForm();
                } else {
                    // Show error message
                    throw new Error(data.message || 'Error publishing');
                }
            } catch (error) {
                console.error('Error publishing:', error);
                showToast(error.message || 'Error publishing', 'error');
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
    
    // Function to reset the form
    function resetForm() {
        const postContent = document.getElementById('post-content');
        const mediaUpload = document.getElementById('media-upload');
        const mediaPreview = document.getElementById('media-preview');
        
        if (postContent) postContent.value = '';
        if (mediaUpload) mediaUpload.value = '';
        if (mediaPreview) mediaPreview.classList.add('hidden');
        
        // Reset scheduled datetime
        const scheduleDay = document.getElementById('schedule-day');
        const scheduleTime = document.getElementById('schedule-time');
        
        if (scheduleDay) scheduleDay.value = '';
        if (scheduleTime) scheduleTime.value = '';
        
        // Reset to "Publish Now" option
        const publishNowOption = document.querySelector('input[name="publish-option"][value="now"]');
        if (publishNowOption) {
            publishNowOption.checked = true;
            const event = new Event('change');
            publishNowOption.dispatchEvent(event);
        }
    }

    // Function to show toast notifications
    function showToast(message, type = 'info') {
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
    
    // Initialize social network selection
    document.querySelectorAll('.social-network-card input').forEach(input => {
        input.addEventListener('change', function() {
            const card = this.closest('.social-network-card');
            
            if (this.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    });
    
    // Initialize post preview
    updatePreview();
});
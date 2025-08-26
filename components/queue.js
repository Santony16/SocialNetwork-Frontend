document.addEventListener('DOMContentLoaded', function() {
    console.log('Queue script loaded');
    
    // Tab switching functionality
    const tabs = document.querySelectorAll('.queue-tab');
    const contentDivs = document.querySelectorAll('.queue-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active', 'border-blue-600', 'text-blue-600'));
            tabs.forEach(t => t.classList.add('text-gray-500'));
            
            // Add active class to current tab
            this.classList.add('active', 'border-blue-600', 'text-blue-600');
            this.classList.remove('text-gray-500');
            
            // Hide all content divs
            contentDivs.forEach(div => div.classList.add('hidden'));
            
            // Show the corresponding content div
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-queue`).classList.remove('hidden');
        });
    });
    
    // Refresh animation
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            icon.classList.add('fa-spin');
            
            // Remove the spin class after animation completes
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 1000);
            
            // This would be replaced with actual API call to refresh data
            loadQueueData();
        });
    }
    
    // Function to check if there are posts and toggle empty state
    function updateEmptyState(containerId, emptyStateSelector) {
        const container = document.getElementById(containerId);
        const posts = container.querySelectorAll('.post-item');
        const emptyState = container.previousElementSibling; 
        
        if (posts.length === 0) {
            emptyState.classList.remove('hidden');
            container.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            container.classList.remove('hidden');
        }
    }
    
    // Function to update count badges
    function updateCountBadges(pendingCount, publishedCount) {
        const pendingBadge = document.querySelector('[data-tab="pending"] .count-badge');
        const publishedBadge = document.querySelector('[data-tab="published"] .count-badge');
        
        if (pendingBadge) pendingBadge.textContent = pendingCount || '0';
        if (publishedBadge) publishedBadge.textContent = publishedCount || '0';
    }
    
    function loadQueueData() {
        
        // Clear existing posts
        document.getElementById('pending-posts-container').innerHTML = '';
        document.getElementById('published-posts-container').innerHTML = '';
        
        // Update empty states
        updateEmptyState('pending-posts-container');
        updateEmptyState('published-posts-container');
        
        // Update badges to 0
        updateCountBadges(0, 0);
    }
    
    // Call initial load
    loadQueueData();
});

function createPendingPostElement(post) {
    const template = document.getElementById('pending-post-template');
    const postElement = document.importNode(template.content, true);

    
    return postElement;
}

function createPublishedPostElement(post) {
    const template = document.getElementById('published-post-template');
    const postElement = document.importNode(template.content, true);
    
    return postElement;
}

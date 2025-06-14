      // Function to handle template preview
      function previewTemplate(templateId) {
        const modal = document.getElementById('previewModal');
        const iframe = document.getElementById('previewFrame');
        
        // Set the iframe source to the template preview URL
        iframe.src = `/preview_template/${templateId}`;
        
        // Show the modal
        modal.style.display = 'block';
        
        // Disable scrolling on the body
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        const modal = document.getElementById('previewModal');
        const iframe = document.getElementById('previewFrame');
        
        // Hide the modal
        modal.style.display = 'none';
        
        // Clear the iframe source
        iframe.src = '';
        
        // Enable scrolling on the body
        document.body.style.overflow = 'auto';
    }
    
    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        const modal = document.getElementById('previewModal');
        if (event.target == modal) {
            closeModal();
        }
    }
    
    // Function to show toast notification
    function showToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // Function to handle saving/unsaving templates
    function setupSaveButtons() {
        // Get all save buttons
        const saveButtons = document.querySelectorAll('.save-btn');
        
        // Get saved templates from server
        fetch('/get_saved_templates')
            .then(response => response.json())
            .then(data => {
                const savedTemplates = data.saved_templates || [];
                
                // Update button states based on saved templates
                saveButtons.forEach(button => {
                    const templateId = button.getAttribute('data-template-id');
                    if (savedTemplates.includes(templateId)) {
                        button.classList.add('saved');
                    }
                    
                    // Add click event listener
                    button.addEventListener('click', function() {
                        const templateId = this.getAttribute('data-template-id');
                        
                        // Toggle saved state
                        if (this.classList.contains('saved')) {
                            // Remove from saved templates
                            fetch(`/remove_template/${templateId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.status === 'success') {
                                    this.classList.remove('saved');
                                    showToast('Template removed from saved templates');
                                } else {
                                    showToast('Error: ' + data.message);
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                showToast('An error occurred. Please try again.');
                            });
                        } else {
                            // Add to saved templates
                            fetch(`/save_template/${templateId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.status === 'success') {
                                    this.classList.add('saved');
                                    showToast('Template saved successfully');
                                } else {
                                    showToast('Error: ' + data.message);
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                showToast('An error occurred. Please try again.');
                            });
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Error loading saved templates');
            });
    }
    
    // Initialize save buttons when the page loads
    document.addEventListener('DOMContentLoaded', setupSaveButtons);
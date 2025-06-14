        // Check resume progress on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Make an AJAX request to get user data
            fetch('/get_user_data')
                .then(response => response.json())
                .then(data => {
                    // Update status indicators
                    if (data.personal) {
                        document.getElementById('personal-status').textContent = 'Complete';
                        document.getElementById('personal-status').classList.add('status-complete');
                    } else {
                        document.getElementById('personal-status').textContent = 'Incomplete';
                        document.getElementById('personal-status').classList.add('status-incomplete');
                    }
                    
                    if (data.education && data.education.length > 0) {
                        document.getElementById('education-status').textContent = 'Complete';
                        document.getElementById('education-status').classList.add('status-complete');
                    } else {
                        document.getElementById('education-status').textContent = 'Incomplete';
                        document.getElementById('education-status').classList.add('status-incomplete');
                    }
                    
                    if (data.skills && data.skills.length > 0) {
                        document.getElementById('skills-status').textContent = 'Complete';
                        document.getElementById('skills-status').classList.add('status-complete');
                    } else {
                        document.getElementById('skills-status').textContent = 'Incomplete';
                        document.getElementById('skills-status').classList.add('status-incomplete');
                    }
                    
                    if (data.projects && data.projects.length > 0) {
                        document.getElementById('projects-status').textContent = 'Complete';
                        document.getElementById('projects-status').classList.add('status-complete');
                    } else {
                        document.getElementById('projects-status').textContent = 'Incomplete';
                        document.getElementById('projects-status').classList.add('status-incomplete');
                    }
                    
                    if (data.selected_template) {
                        document.getElementById('template-status').textContent = data.selected_template.replace('_', ' ').toUpperCase();
                        document.getElementById('template-status').classList.add('status-complete');
                    } else {
                        document.getElementById('template-status').textContent = 'Not Selected';
                        document.getElementById('template-status').classList.add('status-incomplete');
                    }
                })
                .catch(error => {
                    console.error('Error fetching user data:', error);
                });
        });
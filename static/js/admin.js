        let allUsers = [];
        let filteredUsers = [];

        // Initialize the admin dashboard
        document.addEventListener('DOMContentLoaded', function() {
            loadUsers();
            setupEventListeners();
        });

        function setupEventListeners() {
            // Search functionality
            document.getElementById('searchInput').addEventListener('input', function() {
                filterUsers();
            });

            // Filter functionality
            document.getElementById('filterSelect').addEventListener('change', function() {
                filterUsers();
            });

            // Modal close functionality
            document.querySelector('.close').addEventListener('click', function() {
                document.getElementById('userModal').style.display = 'none';
            });

            window.addEventListener('click', function(event) {
                const modal = document.getElementById('userModal');
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        async function loadUsers() {
            try {
                const response = await fetch('/admin/users');
                const data = await response.json();
                
                if (data.success) {
                    allUsers = data.users;
                    filteredUsers = [...allUsers];
                    updateStats(data.stats);
                    displayUsers();
                } else {
                    showError('Failed to load users');
                }
            } catch (error) {
                console.error('Error loading users:', error);
                showError('Error loading users');
            } finally {
                document.getElementById('loadingState').style.display = 'none';
            }
        }

        function updateStats(stats) {
            document.getElementById('totalUsers').textContent = stats.total_users;
            document.getElementById('activeUsers').textContent = stats.active_users;
            document.getElementById('totalResumes').textContent = stats.total_resumes;
            document.getElementById('totalTemplates').textContent = stats.total_templates;
        }

        function displayUsers() {
            const container = document.getElementById('usersContainer');
            const emptyState = document.getElementById('emptyState');

            if (filteredUsers.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';

            container.innerHTML = filteredUsers.map(user => createUserCard(user)).join('');
        }

        function createUserCard(user) {
            const avatar = user.personal?.photo 
                ? `<img src="/static/${user.personal.photo}" alt="${user.name}">`
                : user.name.charAt(0).toUpperCase();

            const completionPercentage = calculateCompletionPercentage(user);
            
            return `
                <div class="user-card">
                    <div class="user-header">
                        <div class="user-avatar">${avatar}</div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                    <div class="user-body">
                        <div class="user-info">
                            <div class="info-row">
                                <span class="info-icon">📱</span>
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${user.personal?.phone || 'Not provided'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">📍</span>
                                <span class="info-label">Address:</span>
                                <span class="info-value">${user.personal?.address || 'Not provided'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">🎓</span>
                                <span class="info-label">Education:</span>
                                <span class="info-value">${user.education?.length || 0} entries</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">💼</span>
                                <span class="info-label">Experience:</span>
                                <span class="info-value">${user.experience?.length || 0} entries</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">⚡</span>
                                <span class="info-label">Skills:</span>
                                <span class="info-value">${user.skills?.length || 0} skills</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">📊</span>
                                <span class="info-label">Profile:</span>
                                <span class="info-value">${completionPercentage}% complete</span>
                            </div>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-primary" onclick="viewUserDetails(${user.id})">
                            👁️ View Details
                        </button>
                        <button class="btn btn-secondary" onclick="exportUserData(${user.id})">
                            📄 Export
                        </button>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }

        function calculateCompletionPercentage(user) {
            let completed = 0;
            const total = 6;

            if (user.personal) completed++;
            if (user.education && user.education.length > 0) completed++;
            if (user.experience && user.experience.length > 0) completed++;
            if (user.skills && user.skills.length > 0) completed++;
            if (user.projects && user.projects.length > 0) completed++;
            if (user.objective) completed++;

            return Math.round((completed / total) * 100);
        }

        function filterUsers() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const filterValue = document.getElementById('filterSelect').value;

            filteredUsers = allUsers.filter(user => {
                // Search filter
                const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                                    user.email.toLowerCase().includes(searchTerm);

                // Category filter
                let matchesFilter = true;
                if (filterValue === 'complete') {
                    matchesFilter = calculateCompletionPercentage(user) >= 80;
                } else if (filterValue === 'incomplete') {
                    matchesFilter = calculateCompletionPercentage(user) < 80;
                } else if (filterValue === 'recent') {
                    // Assuming recent means last 30 days - you'd need to add a created_at field
                    matchesFilter = true; // Placeholder
                }

                return matchesSearch && matchesFilter;
            });

            displayUsers();
        }

        async function viewUserDetails(userId) {
            try {
                const response = await fetch(`/admin/user/${userId}`);
                const data = await response.json();
                
                if (data.success) {
                    showUserModal(data.user);
                } else {
                    showError('Failed to load user details');
                }
            } catch (error) {
                console.error('Error loading user details:', error);
                showError('Error loading user details');
            }
        }

        function showUserModal(user) {
            const modal = document.getElementById('userModal');
            const content = document.getElementById('modalContent');
            
            content.innerHTML = `
                <h2>${user.name} - Detailed Information</h2>
                <div style="margin-top: 20px;">
                    <h3>Personal Information</h3>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.personal?.phone || 'Not provided'}</p>
                    <p><strong>Address:</strong> ${user.personal?.address || 'Not provided'}</p>
                    
                    <h3 style="margin-top: 20px;">Education (${user.education?.length || 0})</h3>
                    ${user.education?.map(edu => `
                        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                            <strong>${edu.course}</strong> at ${edu.school}<br>
                            Grade: ${edu.grade} | Year: ${edu.year}
                        </div>
                    `).join('') || '<p>No education entries</p>'}
                    
                    <h3 style="margin-top: 20px;">Experience (${user.experience?.length || 0})</h3>
                    ${user.experience?.map(exp => `
                        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                            <strong>${exp.job_title}</strong> at ${exp.company}<br>
                            ${exp.start_date} - ${exp.end_date}<br>
                            <small>${exp.details}</small>
                        </div>
                    `).join('') || '<p>No experience entries</p>'}
                    
                    <h3 style="margin-top: 20px;">Skills (${user.skills?.length || 0})</h3>
                    ${user.skills?.map(skill => `
                        <span style="display: inline-block; margin: 5px; padding: 5px 10px; background: #667eea; color: white; border-radius: 15px; font-size: 0.8rem;">
                            ${skill.skill_name} (${skill.skill_level}/5)
                        </span>
                    `).join('') || '<p>No skills listed</p>'}
                </div>
            `;
            
            modal.style.display = 'block';
        }

        async function exportUserData(userId) {
            try {
                const response = await fetch(`/admin/export/${userId}`);
                const blob = await response.blob();
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `user_${userId}_data.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error exporting user data:', error);
                showError('Error exporting user data');
            }
        }

        async function deleteUser(userId) {
            if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                return;
            }

            try {
                const response = await fetch(`/admin/delete/${userId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                
                if (data.success) {
                    // Remove user from local arrays
                    allUsers = allUsers.filter(user => user.id !== userId);
                    filteredUsers = filteredUsers.filter(user => user.id !== userId);
                    displayUsers();
                    
                    // Update stats
                    loadUsers();
                } else {
                    showError('Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                showError('Error deleting user');
            }
        }

        function showError(message) {
            alert(message); // You can replace this with a more sophisticated notification system
        }
/**
 * Profile Editor
 * Handles profile editing, password changes, and account management
 */

(function() {
    'use strict';
    
    console.log('👤 Profile Editor initializing...');
    
    /**
     * Show profile edit modal
     */
    window.showProfileEditModal = async function() {
        console.log('📝 Opening profile editor...');
        
        if (!window.authManager || !window.authManager.currentUser) {
            alert('Please sign in to edit your profile');
            return;
        }
        
        const user = window.authManager.currentUser;
        
        const modal = document.createElement('div');
        modal.id = 'profile-edit-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .profile-tab-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    background: transparent;
                    color: #6b7280;
                    font-weight: 600;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                .profile-tab-btn.active {
                    color: #4a7c2c;
                    border-bottom-color: #4a7c2c;
                }
                .profile-tab-content {
                    display: none;
                }
                .profile-tab-content.active {
                    display: block;
                }
            </style>
            
            <div style="background: white; border-radius: 20px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #4a7c2c 0%, #6ba83d 100%); padding: 32px; border-radius: 20px 20px 0 0; text-align: center; color: white;">
                    <div style="font-size: 48px; margin-bottom: 12px;">👤</div>
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800;">Profile Settings</h2>
                    <p style="margin: 0; opacity: 0.9; font-size: 15px;">${user.email}</p>
                </div>
                
                <!-- Tabs -->
                <div style="display: flex; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                    <button class="profile-tab-btn active" onclick="switchProfileTab('info')">Profile Info</button>
                    <button class="profile-tab-btn" onclick="switchProfileTab('password')">Password</button>
                    <button class="profile-tab-btn" onclick="switchProfileTab('account')">Account</button>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                    <!-- Profile Info Tab -->
                    <div id="profile-tab-info" class="profile-tab-content active">
                        <form id="profile-info-form" onsubmit="handleProfileUpdate(event)">
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                    Display Name
                                </label>
                                <input type="text" id="profile-name" value="${user.name || ''}" 
                                       placeholder="Your name"
                                       style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                    Email Address
                                </label>
                                <input type="email" id="profile-email" value="${user.email || ''}" disabled
                                       style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px; background: #f9fafb; color: #6b7280;">
                                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                                    To change your email, use the Account tab
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                    Account Type
                                </label>
                                <div style="padding: 12px 16px; background: #f0f9f4; border: 2px solid #4a7c2c; border-radius: 10px; font-size: 14px; color: #4a7c2c; font-weight: 600;">
                                    ${user.type === 'google' ? '🔵 Google Account' : user.type === 'trial' ? '🎁 Trial Account' : '📧 Email Account'}
                                </div>
                            </div>
                            
                            <button type="submit" id="profile-update-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #4a7c2c 0%, #6ba83d 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer;">
                                <span id="profile-update-text">💾 Save Changes</span>
                                <span id="profile-update-spinner" style="display: none;">⏳ Saving...</span>
                            </button>
                            
                            <div id="profile-message" style="margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; display: none;"></div>
                        </form>
                    </div>
                    
                    <!-- Password Tab -->
                    <div id="profile-tab-password" class="profile-tab-content">
                        ${user.type === 'google' ? `
                            <div style="text-align: center; padding: 40px 20px;">
                                <div style="font-size: 48px; margin-bottom: 16px;">🔵</div>
                                <h3 style="font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Google Account</h3>
                                <p style="color: #6b7280;">You sign in with Google. To change your password, visit your Google Account settings.</p>
                                <a href="https://myaccount.google.com/security" target="_blank" 
                                   style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #4285f4; color: white; border-radius: 10px; text-decoration: none; font-weight: 600;">
                                    Open Google Account
                                </a>
                            </div>
                        ` : `
                            <form id="password-change-form" onsubmit="handlePasswordChange(event)">
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                        Current Password
                                    </label>
                                    <input type="password" id="current-password" required
                                           placeholder="Enter current password"
                                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                                </div>
                                
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                        New Password
                                    </label>
                                    <input type="password" id="new-password" required minlength="6"
                                           placeholder="At least 6 characters"
                                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                                </div>
                                
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                        Confirm New Password
                                    </label>
                                    <input type="password" id="confirm-password" required
                                           placeholder="Re-enter new password"
                                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                                </div>
                                
                                <button type="submit" id="password-change-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer;">
                                    <span id="password-change-text">🔑 Change Password</span>
                                    <span id="password-change-spinner" style="display: none;">⏳ Updating...</span>
                                </button>
                                
                                <div id="password-message" style="margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; display: none;"></div>
                            </form>
                        `}
                    </div>
                    
                    <!-- Account Tab -->
                    <div id="profile-tab-account" class="profile-tab-content">
                        <div style="margin-bottom: 24px;">
                            <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 12px;">Account Information</h3>
                            
                            <div style="background: #f9fafb; padding: 16px; border-radius: 10px; margin-bottom: 16px;">
                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Email</div>
                                    <div style="font-weight: 600; color: #1f2937;">${user.email}</div>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Account Type</div>
                                    <div style="font-weight: 600; color: #1f2937;">${user.type === 'google' ? 'Google' : user.type === 'trial' ? 'Trial' : 'Email'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Member Since</div>
                                    <div style="font-weight: 600; color: #1f2937;">${new Date(user.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                        
                        ${user.type === 'trial' ? `
                            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                                <div style="font-weight: 700; color: #92400e; margin-bottom: 8px;">🎁 Trial Account</div>
                                <div style="color: #92400e; font-size: 14px;">
                                    ${user.trialDaysRemaining ? `${user.trialDaysRemaining} days remaining` : 'Trial period'}
                                </div>
                                <button onclick="alert('Upgrade feature coming soon!')" 
                                        style="margin-top: 12px; padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                    Upgrade to Pro
                                </button>
                            </div>
                        ` : ''}
                        
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                            <h4 style="font-size: 16px; font-weight: 700; color: #ef4444; margin-bottom: 12px;">Danger Zone</h4>
                            <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">
                                Once you delete your account, there is no going back. This action is permanent.
                            </p>
                            <button onclick="handleAccountDeletion()" 
                                    style="padding: 12px 24px; background: #fee2e2; color: #ef4444; border: 2px solid #ef4444; border-radius: 10px; font-weight: 700; cursor: pointer;">
                                🗑️ Delete Account
                            </button>
                        </div>
                    </div>
                    
                    <!-- Close Button -->
                    <button onclick="closeProfileEditModal()" 
                            style="width: 100%; padding: 12px; background: white; color: #6b7280; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 20px;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProfileEditModal();
            }
        });
    };
    
    /**
     * Close profile edit modal
     */
    window.closeProfileEditModal = function() {
        const modal = document.getElementById('profile-edit-modal');
        if (modal) {
            modal.remove();
        }
    };
    
    /**
     * Switch profile tabs
     */
    window.switchProfileTab = function(tab) {
        // Update tab buttons
        document.querySelectorAll('.profile-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="switchProfileTab('${tab}')"]`)?.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.profile-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`profile-tab-${tab}`)?.classList.add('active');
    };
    
    /**
     * Handle profile update
     */
    window.handleProfileUpdate = async function(event) {
        event.preventDefault();
        
        const name = document.getElementById('profile-name').value.trim();
        const btn = document.getElementById('profile-update-btn');
        const btnText = document.getElementById('profile-update-text');
        const spinner = document.getElementById('profile-update-spinner');
        const messageDiv = document.getElementById('profile-message');
        
        // Show loading
        btn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline';
        messageDiv.style.display = 'none';
        
        try {
            await window.authManager.updateProfile({
                displayName: name
            });
            
            // Show success
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#d1fae5';
            messageDiv.style.color = '#065f46';
            messageDiv.textContent = '✅ Profile updated successfully!';
            
            // Reload header display
            if (window.location.reload) {
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
            
        } catch (error) {
            console.error('Profile update error:', error);
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#fee2e2';
            messageDiv.style.color = '#991b1b';
            messageDiv.textContent = '❌ Failed to update profile: ' + error.message;
            
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    };
    
    /**
     * Handle password change
     */
    window.handlePasswordChange = async function(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const btn = document.getElementById('password-change-btn');
        const btnText = document.getElementById('password-change-text');
        const spinner = document.getElementById('password-change-spinner');
        const messageDiv = document.getElementById('password-message');
        
        // Validation
        if (newPassword.length < 6) {
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#fee2e2';
            messageDiv.style.color = '#991b1b';
            messageDiv.textContent = '❌ Password must be at least 6 characters';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#fee2e2';
            messageDiv.style.color = '#991b1b';
            messageDiv.textContent = '❌ Passwords do not match';
            return;
        }
        
        // Show loading
        btn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline';
        messageDiv.style.display = 'none';
        
        try {
            await window.authManager.updatePassword(currentPassword, newPassword);
            
            // Show success
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#d1fae5';
            messageDiv.style.color = '#065f46';
            messageDiv.textContent = '✅ Password updated successfully!';
            
            // Clear form
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            
        } catch (error) {
            console.error('Password change error:', error);
            
            let errorMessage = 'Failed to update password';
            if (error.message.includes('wrong-password')) {
                errorMessage = 'Current password is incorrect';
            } else if (error.message.includes('weak-password')) {
                errorMessage = 'New password is too weak';
            }
            
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#fee2e2';
            messageDiv.style.color = '#991b1b';
            messageDiv.textContent = '❌ ' + errorMessage;
        }
        
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    };
    
    /**
     * Handle account deletion
     */
    window.handleAccountDeletion = async function() {
        const user = window.authManager.currentUser;
        
        if (!confirm(`⚠️ Are you absolutely sure you want to delete your account?\n\nThis will permanently delete:\n• Your profile\n• All your recipes\n• All your menus\n• All your data\n\nThis action CANNOT be undone.`)) {
            return;
        }
        
        if (!confirm('Type "DELETE" to confirm')) {
            return;
        }
        
        const password = prompt('Enter your password to confirm deletion:');
        
        if (!password) {
            return;
        }
        
        try {
            await window.authManager.deleteAccount(password);
            
            alert('Your account has been deleted. You will be redirected to the login page.');
            window.location.href = 'launch.html';
            
        } catch (error) {
            console.error('Account deletion error:', error);
            
            let errorMessage = 'Failed to delete account';
            if (error.message.includes('wrong-password')) {
                errorMessage = 'Incorrect password';
            }
            
            alert('❌ ' + errorMessage);
        }
    };
    
    console.log('✅ Profile Editor loaded');
    
})();


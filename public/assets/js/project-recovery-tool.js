/**
 * Project Recovery Tool
 * Finds and recovers lost projects from all localStorage keys
 */

class ProjectRecoveryTool {
    /**
     * Search all localStorage for projects
     */
    findAllProjects() {
        console.log('🔍 Searching for projects in all storage keys...');
        
        const allProjects = [];
        const foundIn = {};
        
        // Search all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key && key.includes('project')) {
                try {
                    const data = localStorage.getItem(key);
                    const parsed = JSON.parse(data);
                    
                    if (Array.isArray(parsed)) {
                        parsed.forEach(project => {
                            if (project.id && project.name) {
                                allProjects.push({
                                    ...project,
                                    foundInKey: key
                                });
                                
                                if (!foundIn[key]) foundIn[key] = [];
                                foundIn[key].push(project.name);
                            }
                        });
                    } else if (parsed && parsed.id && parsed.name) {
                        allProjects.push({
                            ...parsed,
                            foundInKey: key
                        });
                        
                        if (!foundIn[key]) foundIn[key] = [];
                        foundIn[key].push(parsed.name);
                    }
                } catch (e) {
                    // Not JSON or not a project
                }
            }
        }
        
        console.log('📊 Found projects in these keys:', foundIn);
        console.log(`✅ Total projects found: ${allProjects.length}`);
        
        return allProjects;
    }

    /**
     * Find a specific project by name
     */
    findProjectByName(projectName) {
        console.log(`🔍 Searching for project: "${projectName}"...`);
        
        const allProjects = this.findAllProjects();
        const matches = allProjects.filter(p => 
            p.name.toLowerCase().includes(projectName.toLowerCase())
        );
        
        if (matches.length > 0) {
            console.log(`✅ Found ${matches.length} matching project(s):`, matches);
            return matches;
        } else {
            console.log('❌ Project not found');
            return [];
        }
    }

    /**
     * Recover and restore a project
     */
    recoverProject(project) {
        console.log(`🔄 Recovering project: "${project.name}"...`);
        
        try {
            // Get current user
            const currentUser = this.getCurrentUser();
            const userId = currentUser?.userId || currentUser?.id;
            
            if (!userId) {
                console.error('❌ No user ID found, cannot recover project');
                return false;
            }
            
            // Get current user's projects storage key
            const userStorageKey = `iterum_projects_user_${userId}`;
            let projects = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
            
            // Check if project already exists
            const existingIndex = projects.findIndex(p => p.id === project.id || p.name === project.name);
            
            if (existingIndex !== -1) {
                // Update existing
                projects[existingIndex] = {
                    ...projects[existingIndex],
                    ...project,
                    recoveredAt: new Date().toISOString()
                };
                console.log('♻️ Updated existing project');
            } else {
                // Add new
                const recoveredProject = {
                    ...project,
                    recoveredAt: new Date().toISOString()
                };
                delete recoveredProject.foundInKey; // Remove metadata
                projects.push(recoveredProject);
                console.log('➕ Added recovered project');
            }
            
            // Save back
            localStorage.setItem(userStorageKey, JSON.stringify(projects));
            
            // Also update global if project manager exists
            if (window.projectManager) {
                window.projectManager.projects = projects;
                window.projectManager.updateProjectUI();
            }
            
            console.log(`✅ Project "${project.name}" recovered successfully!`);
            return true;
            
        } catch (error) {
            console.error('❌ Error recovering project:', error);
            return false;
        }
    }

    /**
     * Consolidate all projects into current user's storage
     */
    consolidateProjects() {
        console.log('🔄 Consolidating all projects...');
        
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id;
        
        if (!userId) {
            console.error('❌ No user ID, cannot consolidate');
            return false;
        }
        
        const allProjects = this.findAllProjects();
        const userStorageKey = `iterum_projects_user_${userId}`;
        let userProjects = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
        
        let consolidated = 0;
        
        allProjects.forEach(project => {
            // Check if not already in user's projects
            if (!userProjects.find(p => p.id === project.id)) {
                const cleanProject = { ...project };
                delete cleanProject.foundInKey;
                userProjects.push(cleanProject);
                consolidated++;
            }
        });
        
        // Save consolidated projects
        localStorage.setItem(userStorageKey, JSON.stringify(userProjects));
        
        // Update project manager
        if (window.projectManager) {
            window.projectManager.projects = userProjects;
            window.projectManager.updateProjectUI();
        }
        
        console.log(`✅ Consolidated ${consolidated} projects into current user storage`);
        alert(`✅ Recovered ${consolidated} projects!\n\nYour projects have been restored.`);
        
        return consolidated;
    }

    /**
     * List all projects in console (for debugging)
     */
    listAllProjects() {
        const allProjects = this.findAllProjects();
        
        console.log('📋 ALL PROJECTS IN STORAGE:');
        console.log('═'.repeat(50));
        
        const grouped = {};
        allProjects.forEach(p => {
            if (!grouped[p.foundInKey]) grouped[p.foundInKey] = [];
            grouped[p.foundInKey].push(p.name);
        });
        
        Object.entries(grouped).forEach(([key, names]) => {
            console.log(`\n📦 ${key}:`);
            names.forEach((name, i) => console.log(`  ${i+1}. ${name}`));
        });
        
        console.log('\n' + '═'.repeat(50));
        console.log(`Total: ${allProjects.length} projects found`);
        
        return allProjects;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        if (window.currentUser) return window.currentUser;
        
        const userJson = localStorage.getItem('current_user');
        if (userJson) {
            try {
                return JSON.parse(userJson);
            } catch (e) {
                return null;
            }
        }
        return null;
    }
}

// Initialize global instance
window.projectRecoveryTool = new ProjectRecoveryTool();

// Global helper functions
window.findMyProjects = function() {
    return window.projectRecoveryTool.listAllProjects();
};

window.recoverProject = function(projectName) {
    const matches = window.projectRecoveryTool.findProjectByName(projectName);
    
    if (matches.length === 0) {
        console.log(`❌ Project "${projectName}" not found anywhere in storage`);
        alert(`❌ Project "${projectName}" not found.\n\nIt may have been deleted or never saved.`);
        return false;
    }
    
    console.log(`Found ${matches.length} matching project(s):`, matches);
    
    // Recover the first match
    const recovered = window.projectRecoveryTool.recoverProject(matches[0]);
    
    if (recovered) {
        alert(`✅ Project "${matches[0].name}" recovered!\n\nPlease refresh the page to see it.`);
        return true;
    }
    
    return false;
};

window.consolidateAllProjects = function() {
    return window.projectRecoveryTool.consolidateProjects();
};

console.log('🔧 Project Recovery Tool ready');
console.log('💡 Use these commands:');
console.log('  - window.findMyProjects() - List all projects');
console.log('  - window.recoverProject("89 Charles") - Recover specific project');
console.log('  - window.consolidateAllProjects() - Consolidate all projects');


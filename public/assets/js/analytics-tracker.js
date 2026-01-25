/**
 * Analytics Tracker v1.0
 * Comprehensive event tracking for Iterum Culinary App
 * Tracks user actions, conversions, errors, and feature usage
 */

import { getAnalytics, logEvent, setUserProperties, setUserId } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

class AnalyticsTracker {
    constructor() {
        this.analytics = null;
        this.isInitialized = false;
        this.userId = null;
        this.sessionStartTime = Date.now();
        
        console.log('📊 Analytics Tracker initializing...');
    }

    /**
     * Initialize analytics
     */
    async init(firebaseApp) {
        try {
            if (!firebaseApp) {
                console.warn('⚠️ Firebase app not provided to Analytics');
                return false;
            }

            this.analytics = getAnalytics(firebaseApp);
            this.isInitialized = true;
            
            // Track session start
            this.trackEvent('session_start', {
                timestamp: new Date().toISOString(),
                page: window.location.pathname
            });
            
            console.log('✅ Analytics Tracker initialized');
            return true;
        } catch (error) {
            console.error('❌ Analytics initialization failed:', error);
            return false;
        }
    }

    /**
     * Track a custom event
     */
    trackEvent(eventName, eventParams = {}) {
        if (!this.isInitialized || !this.analytics) {
            console.warn('⚠️ Analytics not initialized, event not tracked:', eventName);
            return;
        }

        try {
            // Add common parameters
            const enrichedParams = {
                ...eventParams,
                page: window.location.pathname,
                timestamp: new Date().toISOString()
            };

            logEvent(this.analytics, eventName, enrichedParams);
            console.log('📊 Event tracked:', eventName, enrichedParams);
        } catch (error) {
            console.error('❌ Failed to track event:', eventName, error);
        }
    }

    /**
     * Set user ID for tracking
     */
    setUser(userId, userProperties = {}) {
        if (!this.isInitialized || !this.analytics) return;

        try {
            this.userId = userId;
            setUserId(this.analytics, userId);
            
            if (Object.keys(userProperties).length > 0) {
                setUserProperties(this.analytics, userProperties);
            }
            
            console.log('📊 User ID set:', userId);
        } catch (error) {
            console.error('❌ Failed to set user:', error);
        }
    }

    // ========================================
    // AUTHENTICATION EVENTS
    // ========================================

    trackSignUp(method, userName = null) {
        this.trackEvent('sign_up', {
            method: method, // 'google', 'email', 'trial'
            user_name: userName
        });
    }

    trackLogin(method, userId = null) {
        this.trackEvent('login', {
            method: method,
            user_id: userId
        });
    }

    trackSignOut() {
        this.trackEvent('sign_out', {
            session_duration: Date.now() - this.sessionStartTime
        });
    }

    trackPasswordReset(email) {
        this.trackEvent('password_reset_requested', {
            email_domain: email.split('@')[1]
        });
    }

    trackEmailVerification(sent = true) {
        this.trackEvent('email_verification', {
            action: sent ? 'sent' : 'verified'
        });
    }

    trackProfileUpdate(fields = []) {
        this.trackEvent('profile_updated', {
            fields_updated: fields.join(',')
        });
    }

    // ========================================
    // TRIAL & CONVERSION EVENTS
    // ========================================

    trackTrialStart(userName, trialDays = 14) {
        this.trackEvent('trial_started', {
            trial_days: trialDays,
            user_name: userName
        });
    }

    trackTrialExpiring(daysRemaining) {
        this.trackEvent('trial_expiring_soon', {
            days_remaining: daysRemaining
        });
    }

    trackTrialExpired() {
        this.trackEvent('trial_expired');
    }

    trackUpgradeIntent(fromPlan = 'trial') {
        this.trackEvent('upgrade_intent', {
            from_plan: fromPlan
        });
    }

    // ========================================
    // RECIPE EVENTS
    // ========================================

    trackRecipeCreated(method, recipeName = null) {
        this.trackEvent('recipe_created', {
            method: method, // 'upload', 'manual', 'url'
            recipe_name: recipeName
        });
    }

    trackRecipeUploaded(fileType, fileSize = null) {
        this.trackEvent('recipe_uploaded', {
            file_type: fileType,
            file_size_kb: fileSize ? Math.round(fileSize / 1024) : null
        });
    }

    trackRecipeViewed(recipeId, recipeName = null) {
        this.trackEvent('recipe_viewed', {
            recipe_id: recipeId,
            recipe_name: recipeName
        });
    }

    trackRecipeEdited(recipeId) {
        this.trackEvent('recipe_edited', {
            recipe_id: recipeId
        });
    }

    trackRecipeDeleted(recipeId) {
        this.trackEvent('recipe_deleted', {
            recipe_id: recipeId
        });
    }

    trackRecipeScaled(recipeId, scaleFactor) {
        this.trackEvent('recipe_scaled', {
            recipe_id: recipeId,
            scale_factor: scaleFactor
        });
    }

    trackRecipeSearch(searchTerm, resultsCount = null) {
        this.trackEvent('recipe_searched', {
            search_term: searchTerm,
            results_count: resultsCount
        });
    }

    // ========================================
    // MENU EVENTS
    // ========================================

    trackMenuCreated(menuName, itemCount = null) {
        this.trackEvent('menu_created', {
            menu_name: menuName,
            item_count: itemCount
        });
    }

    trackMenuViewed(menuId, menuName = null) {
        this.trackEvent('menu_viewed', {
            menu_id: menuId,
            menu_name: menuName
        });
    }

    trackMenuEdited(menuId) {
        this.trackEvent('menu_edited', {
            menu_id: menuId
        });
    }

    trackMenuDeleted(menuId) {
        this.trackEvent('menu_deleted', {
            menu_id: menuId
        });
    }

    // ========================================
    // INGREDIENT EVENTS
    // ========================================

    trackIngredientSearch(searchTerm, resultsCount = null) {
        this.trackEvent('ingredient_searched', {
            search_term: searchTerm,
            results_count: resultsCount
        });
    }

    trackIngredientAdded(ingredientName) {
        this.trackEvent('ingredient_added', {
            ingredient_name: ingredientName
        });
    }

    trackIngredientEdited(ingredientId) {
        this.trackEvent('ingredient_edited', {
            ingredient_id: ingredientId
        });
    }

    // ========================================
    // PROJECT EVENTS
    // ========================================

    trackProjectCreated(projectName) {
        this.trackEvent('project_created', {
            project_name: projectName
        });
    }

    trackProjectSwitched(projectId, projectName = null) {
        this.trackEvent('project_switched', {
            project_id: projectId,
            project_name: projectName
        });
    }

    trackProjectEdited(projectId) {
        this.trackEvent('project_edited', {
            project_id: projectId
        });
    }

    trackProjectDeleted(projectId) {
        this.trackEvent('project_deleted', {
            project_id: projectId
        });
    }

    // ========================================
    // NAVIGATION EVENTS
    // ========================================

    trackPageView(pageName, pageTitle = null) {
        this.trackEvent('page_view', {
            page_name: pageName,
            page_title: pageTitle || document.title
        });
    }

    trackNavigationClick(destination, source = null) {
        this.trackEvent('navigation_click', {
            destination: destination,
            source: source
        });
    }

    // ========================================
    // UI INTERACTION EVENTS
    // ========================================

    trackButtonClick(buttonName, context = null) {
        this.trackEvent('button_click', {
            button_name: buttonName,
            context: context
        });
    }

    trackModalOpened(modalName) {
        this.trackEvent('modal_opened', {
            modal_name: modalName
        });
    }

    trackModalClosed(modalName, action = null) {
        this.trackEvent('modal_closed', {
            modal_name: modalName,
            action: action // 'submit', 'cancel', 'close'
        });
    }

    trackFormSubmitted(formName, success = true) {
        this.trackEvent('form_submitted', {
            form_name: formName,
            success: success
        });
    }

    trackDropdownOpened(dropdownName) {
        this.trackEvent('dropdown_opened', {
            dropdown_name: dropdownName
        });
    }

    // ========================================
    // ERROR & PERFORMANCE EVENTS
    // ========================================

    trackError(errorType, errorMessage = null, errorContext = null) {
        this.trackEvent('error_occurred', {
            error_type: errorType,
            error_message: errorMessage,
            error_context: errorContext
        });
    }

    trackAPICall(endpoint, method, success = true, duration = null) {
        this.trackEvent('api_call', {
            endpoint: endpoint,
            method: method,
            success: success,
            duration_ms: duration
        });
    }

    trackLoadTime(pageName, loadTime) {
        this.trackEvent('page_load_time', {
            page_name: pageName,
            load_time_ms: loadTime
        });
    }

    // ========================================
    // FEATURE USAGE EVENTS
    // ========================================

    trackFeatureUsed(featureName, featureContext = null) {
        this.trackEvent('feature_used', {
            feature_name: featureName,
            feature_context: featureContext
        });
    }

    trackExportData(exportType, format = null) {
        this.trackEvent('data_exported', {
            export_type: exportType, // 'recipe', 'menu', 'inventory'
            format: format // 'pdf', 'csv', 'json'
        });
    }

    trackPrintAction(contentType) {
        this.trackEvent('print_action', {
            content_type: contentType
        });
    }

    // ========================================
    // ENGAGEMENT EVENTS
    // ========================================

    trackHelpViewed(helpTopic) {
        this.trackEvent('help_viewed', {
            help_topic: helpTopic
        });
    }

    trackTutorialStarted(tutorialName) {
        this.trackEvent('tutorial_started', {
            tutorial_name: tutorialName
        });
    }

    trackTutorialCompleted(tutorialName) {
        this.trackEvent('tutorial_completed', {
            tutorial_name: tutorialName
        });
    }

    trackFeedbackSubmitted(feedbackType, rating = null) {
        this.trackEvent('feedback_submitted', {
            feedback_type: feedbackType,
            rating: rating
        });
    }

    // ========================================
    // CUSTOM EVENTS
    // ========================================

    trackCustomEvent(eventName, eventParams = {}) {
        this.trackEvent(eventName, eventParams);
    }
}

// Create and export singleton instance
const analyticsTracker = new AnalyticsTracker();

// Make available globally
window.analyticsTracker = analyticsTracker;

export default analyticsTracker;


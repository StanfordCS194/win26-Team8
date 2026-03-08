import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export function initAnalytics() {
  if (!POSTHOG_KEY) {
    console.warn('[Analytics] PostHog key not found. Analytics disabled.');
    return;
  }
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage',
  });
}

export const AnalyticsEvents = {
  // Onboarding
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  GET_STARTED_CLICKED: 'get_started_clicked',
  WHY_WE_CARE_CLICKED: 'why_we_care_clicked',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  SIGNUP_FAILED: 'signup_failed',
  SIGNIN_COMPLETED: 'signin_completed',
  SIGNIN_FAILED: 'signin_failed',
  SIGNOUT: 'signout',
  WALKTHROUGH_STEP_VIEWED: 'walkthrough_step_viewed',
  WALKTHROUGH_COMPLETED: 'walkthrough_completed',
  WALKTHROUGH_SKIPPED: 'walkthrough_skipped',

  // Navigation
  VIEW_CHANGED: 'view_changed',

  // Add item funnel
  ADD_ITEM_STEP_COMPLETED: 'add_item_step_completed',
  URL_FETCH_ATTEMPTED: 'url_fetch_attempted',
  CONSTRAINT_SELECTED: 'constraint_selected',
  ITEM_SAVED: 'item_saved',
  ADD_ITEM_CANCELLED: 'add_item_cancelled',

  // Core interactions
  ITEM_CLICKED: 'item_clicked',
  ITEM_DELETED: 'item_deleted',
  CATEGORY_FILTER_CHANGED: 'category_filter_changed',
  GOAL_UNLOCK_ATTEMPTED: 'goal_unlock_attempted',
  GOAL_UNLOCK_SUCCEEDED: 'goal_unlock_succeeded',

  // Profile
  PROFILE_VIEWED: 'profile_viewed',
} as const;

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

export function trackViewChange(viewName: string, previousView?: string) {
  posthog.capture(AnalyticsEvents.VIEW_CHANGED, {
    view: viewName,
    previous_view: previousView,
    $current_url: `${window.location.origin}/${viewName}`,
  });
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog.identify(userId, properties);
}

export function resetUser() {
  posthog.reset();
}

export function setUserProperties(properties: Record<string, any>) {
  posthog.people.set(properties);
}

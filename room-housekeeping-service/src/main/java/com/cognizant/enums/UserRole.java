package com.cognizant.enums;

/**
 * Matches the role taxonomy used across user-service and frontend.
 * STAFF is a generic fallback for unknown / legacy role strings.
 */
public enum UserRole {
    GUEST,
    FRONT_DESK_STAFF,
    HOUSEKEEPING_STAFF,
    RESTAURANT_SERVICE_STAFF,
    FINANCE_OFFICER,
    MANAGER,
    ADMINISTRATOR,
    AUDITOR,
    STAFF
}

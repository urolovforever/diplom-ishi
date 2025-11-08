/**
 * Utility functions for formatting display text
 */

/**
 * Replace underscores with spaces in usernames for better readability
 * @param {string} username - The username to format
 * @returns {string} - Formatted username without underscores
 */
export const formatUsername = (username) => {
  return username ? username.replace(/_/g, ' ') : ''
}

/**
 * Format a full name by replacing underscores with spaces
 * @param {string} name - The name to format
 * @returns {string} - Formatted name without underscores
 */
export const formatName = (name) => {
  return name ? name.replace(/_/g, ' ') : ''
}

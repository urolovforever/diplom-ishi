/**
 * Utility functions for formatting display text
 */

import { formatDistanceToNow } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'

// Uzbek locale for date-fns
const uz = {
  formatDistance: (token, count) => {
    const formatDistanceLocale = {
      lessThanXSeconds: count === 1 ? 'bir soniya oldin' : `${count} soniya oldin`,
      xSeconds: count === 1 ? 'bir soniya oldin' : `${count} soniya oldin`,
      halfAMinute: 'yarim daqiqa oldin',
      lessThanXMinutes: count === 1 ? 'bir daqiqa oldin' : `${count} daqiqa oldin`,
      xMinutes: count === 1 ? 'bir daqiqa oldin' : `${count} daqiqa oldin`,
      aboutXHours: count === 1 ? 'taxminan 1 soat oldin' : `taxminan ${count} soat oldin`,
      xHours: count === 1 ? '1 soat oldin' : `${count} soat oldin`,
      xDays: count === 1 ? '1 kun oldin' : `${count} kun oldin`,
      aboutXWeeks: count === 1 ? 'taxminan 1 hafta oldin' : `taxminan ${count} hafta oldin`,
      xWeeks: count === 1 ? '1 hafta oldin' : `${count} hafta oldin`,
      aboutXMonths: count === 1 ? 'taxminan 1 oy oldin' : `taxminan ${count} oy oldin`,
      xMonths: count === 1 ? '1 oy oldin' : `${count} oy oldin`,
      aboutXYears: count === 1 ? 'taxminan 1 yil oldin' : `taxminan ${count} yil oldin`,
      xYears: count === 1 ? '1 yil oldin' : `${count} yil oldin`,
      overXYears: count === 1 ? '1 yildan ortiq' : `${count} yildan ortiq`,
      almostXYears: count === 1 ? 'deyarli 1 yil' : `deyarli ${count} yil`,
    }
    return formatDistanceLocale[token]
  },
  localize: {
    ordinalNumber: (n) => n,
  },
  formatLong: {},
  formatRelative: () => '',
  match: {},
  options: {},
}

/**
 * Get the appropriate date-fns locale based on language code
 * @param {string} language - Language code ('en', 'ru', 'uz')
 * @returns {object} - date-fns locale object
 */
const getDateLocale = (language) => {
  switch (language) {
    case 'ru':
      return ru
    case 'uz':
      return uz
    case 'en':
    default:
      return enUS
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago") in the specified language
 * @param {Date|string} date - The date to format
 * @param {string} language - Language code ('en', 'ru', 'uz')
 * @returns {string} - Formatted relative time
 */
export const formatRelativeTime = (date, language = 'en') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const locale = getDateLocale(language)
    return formatDistanceToNow(dateObj, { addSuffix: true, locale })
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

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

// common/redis/jobs.ts

export const QUEUES = {
  TASK: 'taskQueue',
  RESERVATION: 'reservationQueue',
  LISTING: 'listingQueue',
  CALENDAR_REFRESH: 'calendarRefreshQueue',
  EXECUTOR_AGENT: 'executor_agent_queue',
  RESERVATION_CALCULATION: 'reservationCalculationQueue',
};

export const JOBS = {
  CREATE_TASK: 'createTask',
  CREATE_RESERVATION: 'createReservation',
  CREATE_LISTING: 'createListing',
  REFRESH_LISTING_CALENDAR: 'refreshListingCalendar',
  CALCULATE_RESERVATION: 'calculateReservation'
};

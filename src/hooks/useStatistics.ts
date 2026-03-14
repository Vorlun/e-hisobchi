/**
 * Statistics hook — re-exports useStatistics from statistics store.
 */
export { useStatistics } from '../store/statisticsStore';
export type {
  SummaryStats,
  TimelineDataPoint,
  CategoryStatsItem,
  CalendarStatsItem,
  TopCategoryItem,
  StatsPeriod,
} from '../types/statistics.types';

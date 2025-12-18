/**
 * Dosing Calendar Module
 *
 * Generates and exports dosing schedules to CSV and ICS formats
 */

// Types
export type {
  FrequencyRule,
  ScheduleOptions,
  DoseEvent,
  ArmSchedule,
  StudySchedule,
  ExportFormat,
} from "./types";

// Generator functions
export { generateStudySchedule, armConfigToSchedule } from "./generator";

// Export functions
export {
  generateCSV,
  generateICS,
  exportSchedule,
  downloadSchedule,
  downloadFile,
  getMimeType,
  getFileExtension,
  generateFilename,
  getScheduleStats,
} from "./exporters";

/**
 * Types for Dosing Calendar Export
 *
 * Supports CSV and ICS export formats for study dosing schedules
 */

/**
 * Frequency rule for dosing schedule
 */
export interface FrequencyRule {
  type:
    | "once"
    | "daily"
    | "bid"
    | "tid"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "custom";
  /** For custom: every N days */
  interval?: number;
  /** For weekly: specific days (0=Sun, 1=Mon, etc.) */
  daysOfWeek?: number[];
  /** Number of times per day */
  timesPerDay?: number;
  /** Specific times for dosing (e.g., ["08:00", "20:00"]) */
  specificTimes?: string[];
}

/**
 * Schedule options for calendar generation
 */
export interface ScheduleOptions {
  /** Study start date */
  startDate: Date;
  /** Whether to skip weekend days */
  skipWeekends: boolean;
  /** Whether to skip specified holidays */
  skipHolidays: boolean;
  /** List of holiday dates to skip */
  holidays: Date[];
  /** Timezone for ICS export */
  timezone: string;
  /** Default dosing time if not specified (24h format) */
  defaultTime: string;
  /** Estimated duration per dose in minutes */
  durationMinutes: number;
}

/**
 * A single dose event in the schedule
 */
export interface DoseEvent {
  /** Unique identifier for the event */
  id: string;
  /** Date and time of the dose */
  dateTime: Date;
  /** Study day number (1-indexed) */
  studyDay: number;
  /** Subject identifier */
  subjectId: string;
  /** Arm name */
  armName: string;
  /** Arm type */
  armType: "treatment" | "placebo" | "comparator";
  /** Dose amount */
  doseAmount: number;
  /** Dose unit */
  doseUnit: string;
  /** Administration volume in mL */
  volumeMl: number;
  /** Additional notes */
  notes?: string;
}

/**
 * Arm schedule configuration
 */
export interface ArmSchedule {
  /** Arm identifier */
  armId: string;
  /** Arm name */
  armName: string;
  /** Arm type */
  armType: "treatment" | "placebo" | "comparator";
  /** Number of subjects in the arm */
  subjects: number;
  /** Subject ID prefix (e.g., "M" for mouse) */
  subjectPrefix: string;
  /** Frequency rule */
  frequency: FrequencyRule;
  /** Duration in days */
  durationDays: number;
  /** Dose amount */
  doseAmount: number;
  /** Dose unit */
  doseUnit: string;
  /** Administration volume per dose in mL */
  volumeMl: number;
}

/**
 * Complete study schedule
 */
export interface StudySchedule {
  /** Study name/identifier */
  studyName: string;
  /** Schedule options */
  options: ScheduleOptions;
  /** List of arm schedules */
  arms: ArmSchedule[];
  /** Generated dose events */
  events: DoseEvent[];
}

/**
 * Export format options
 */
export type ExportFormat = "csv" | "ics";

/**
 * Dosing Schedule Generator
 *
 * Generates dose events based on arm configurations and schedule options
 */

import type {
  ArmSchedule,
  DoseEvent,
  FrequencyRule,
  ScheduleOptions,
  StudySchedule,
} from "./types";

/**
 * Generate a unique event ID
 */
function generateEventId(
  armId: string,
  studyDay: number,
  subjectId: string,
): string {
  const timestamp = Date.now().toString(36);
  return `df-${armId}-d${studyDay}-${subjectId}-${timestamp}`;
}

/**
 * Check if a date is a weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a holiday
 */
function isHoliday(date: Date, holidays: Date[]): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return holidays.some((h) => h.toISOString().split("T")[0] === dateStr);
}

/**
 * Maximum iterations to prevent infinite loops when skipping dates
 * 365 days should be more than enough to find a valid date
 */
const MAX_DATE_SKIP_ITERATIONS = 365;

/**
 * Get the next valid dosing date, skipping weekends and holidays if configured
 * Includes protection against infinite loops
 */
function getNextValidDate(date: Date, options: ScheduleOptions): Date {
  const result = new Date(date);
  let iterations = 0;

  while (
    (options.skipWeekends && isWeekend(result)) ||
    (options.skipHolidays && isHoliday(result, options.holidays))
  ) {
    result.setDate(result.getDate() + 1);
    iterations++;

    // Protect against infinite loops (e.g., if all days are holidays)
    if (iterations >= MAX_DATE_SKIP_ITERATIONS) {
      console.warn(
        "Warning: Could not find valid dosing date within 365 days. " +
          "Check holiday/weekend configuration.",
      );
      break;
    }
  }

  return result;
}

/**
 * Convert frequency type to doses per day
 */
function getDosesPerDay(frequency: FrequencyRule): number {
  switch (frequency.type) {
    case "once":
      return 1;
    case "daily":
      return 1;
    case "bid":
      return 2;
    case "tid":
      return 3;
    case "weekly":
    case "biweekly":
    case "monthly":
      return 1;
    case "custom":
      return frequency.timesPerDay ?? 1;
    default:
      return 1;
  }
}

/**
 * Get default times for dosing based on frequency
 */
function getDefaultTimes(
  frequency: FrequencyRule,
  defaultTime: string,
): string[] {
  if (frequency.specificTimes && frequency.specificTimes.length > 0) {
    return frequency.specificTimes;
  }

  const dosesPerDay = getDosesPerDay(frequency);

  if (dosesPerDay === 1) {
    return [defaultTime];
  } else if (dosesPerDay === 2) {
    return ["08:00", "20:00"];
  } else if (dosesPerDay === 3) {
    return ["08:00", "14:00", "20:00"];
  } else {
    // Distribute evenly throughout the day
    const times: string[] = [];
    const startHour = 8;
    const interval = 12 / dosesPerDay;
    for (let i = 0; i < dosesPerDay; i++) {
      const hour = Math.round(startHour + i * interval);
      times.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return times;
  }
}

/**
 * Check if current date matches monthly dosing criteria
 * Handles edge case where start date is on day 29-31 but current month has fewer days
 * In such cases, dose on the last day of the month
 */
function isMonthlyDoseDay(currentDate: Date, startDate: Date): boolean {
  const startDay = startDate.getDate();
  const currentDay = currentDate.getDate();

  // Direct match
  if (currentDay === startDay) {
    return true;
  }

  // Handle months with fewer days than the start day
  // E.g., if start is Jan 31, dose on Feb 28 (or 29 in leap year)
  if (startDay > 28) {
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();

    // If we're on the last day of a short month and start day is beyond it
    if (currentDay === lastDayOfMonth && lastDayOfMonth < startDay) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a day should have dosing based on frequency
 */
function shouldDoseOnDay(
  dayIndex: number,
  frequency: FrequencyRule,
  startDate: Date,
  currentDate: Date,
): boolean {
  switch (frequency.type) {
    case "once":
      return dayIndex === 0;
    case "daily":
    case "bid":
    case "tid":
      return true;
    case "weekly":
      // Only on the same day of week as start date
      return currentDate.getDay() === startDate.getDay();
    case "biweekly": {
      // Every two weeks on the same day of week
      const daysSinceStart = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysSinceStart % 14 === 0;
    }
    case "monthly":
      // Same day of month as start date, with short-month handling
      return isMonthlyDoseDay(currentDate, startDate);
    case "custom": {
      if (frequency.daysOfWeek && frequency.daysOfWeek.length > 0) {
        return frequency.daysOfWeek.includes(currentDate.getDay());
      }
      if (frequency.interval && frequency.interval > 0) {
        const daysSinceStart = Math.floor(
          (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysSinceStart % frequency.interval === 0;
      }
      return true;
    }
    default:
      return true;
  }
}

/**
 * Maximum events per arm to prevent memory issues
 * 100,000 events per arm is generous but prevents runaway generation
 */
const MAX_EVENTS_PER_ARM = 100000;

/**
 * Maximum duration in days to prevent extremely long schedules
 */
const MAX_DURATION_DAYS = 3650; // 10 years

/**
 * Generate events for a single arm
 * Includes validation and safety limits
 */
function generateArmEvents(
  arm: ArmSchedule,
  options: ScheduleOptions,
): DoseEvent[] {
  const events: DoseEvent[] = [];

  // Validate arm configuration
  if (!arm || typeof arm.durationDays !== "number") {
    console.warn("Invalid arm configuration: missing or invalid duration");
    return events;
  }

  // Validate and clamp duration
  const safeDuration = Math.min(
    Math.max(0, Math.floor(arm.durationDays)),
    MAX_DURATION_DAYS,
  );

  if (safeDuration === 0) {
    return events;
  }

  if (safeDuration !== arm.durationDays) {
    console.warn(
      `Duration clamped from ${arm.durationDays} to ${safeDuration} days`,
    );
  }

  // Validate subjects count
  const safeSubjects = Math.max(0, Math.floor(arm.subjects || 0));
  if (safeSubjects === 0) {
    return events;
  }

  // Validate start date
  const startDate = new Date(options.startDate);
  if (isNaN(startDate.getTime())) {
    console.warn("Invalid start date provided, using current date");
    startDate.setTime(Date.now());
  }

  const times = getDefaultTimes(arm.frequency, options.defaultTime);

  let currentDate = getNextValidDate(startDate, options);
  let studyDay = 1;
  let daysProcessed = 0;

  while (daysProcessed < safeDuration) {
    // Safety check: prevent generating too many events
    if (events.length >= MAX_EVENTS_PER_ARM) {
      console.warn(
        `Maximum events (${MAX_EVENTS_PER_ARM}) reached for arm "${arm.armName}". ` +
          "Consider reducing duration or subject count.",
      );
      break;
    }

    // Check if we should dose on this day
    if (shouldDoseOnDay(daysProcessed, arm.frequency, startDate, currentDate)) {
      // Generate events for each subject and each dose time
      for (let subjectIndex = 0; subjectIndex < safeSubjects; subjectIndex++) {
        const subjectId = `${arm.subjectPrefix}${String(subjectIndex + 1).padStart(3, "0")}`;

        for (const timeStr of times) {
          // Validate time string format
          const timeParts = timeStr.split(":");
          const hours = parseInt(timeParts[0], 10) || 0;
          const minutes = parseInt(timeParts[1], 10) || 0;

          // Clamp to valid time ranges
          const safeHours = Math.min(23, Math.max(0, hours));
          const safeMinutes = Math.min(59, Math.max(0, minutes));

          const eventDateTime = new Date(currentDate);
          eventDateTime.setHours(safeHours, safeMinutes, 0, 0);

          const event: DoseEvent = {
            id: generateEventId(arm.armId, studyDay, subjectId),
            dateTime: eventDateTime,
            studyDay,
            subjectId,
            armName: arm.armName,
            armType: arm.armType,
            doseAmount:
              arm.armType === "placebo" ? 0 : Math.max(0, arm.doseAmount || 0),
            doseUnit: arm.doseUnit || "mg",
            volumeMl: Math.max(0, arm.volumeMl || 0),
            notes: studyDay === 1 ? "First dose" : undefined,
          };

          events.push(event);

          // Check limit after each event to avoid overshooting
          if (events.length >= MAX_EVENTS_PER_ARM) {
            break;
          }
        }
        if (events.length >= MAX_EVENTS_PER_ARM) {
          break;
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate = getNextValidDate(currentDate, options);
    studyDay++;
    daysProcessed++;
  }

  return events;
}

/**
 * Generate complete study schedule
 */
export function generateStudySchedule(
  studyName: string,
  arms: ArmSchedule[],
  options: Partial<ScheduleOptions> = {},
): StudySchedule {
  // Default options
  const defaultOptions: ScheduleOptions = {
    startDate: new Date(),
    skipWeekends: false,
    skipHolidays: false,
    holidays: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    defaultTime: "09:00",
    durationMinutes: 15,
  };

  const finalOptions: ScheduleOptions = {
    ...defaultOptions,
    ...options,
  };

  // Generate events for all arms
  const allEvents: DoseEvent[] = [];
  for (const arm of arms) {
    const armEvents = generateArmEvents(arm, finalOptions);
    allEvents.push(...armEvents);
  }

  // Sort events by date/time
  allEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  return {
    studyName,
    options: finalOptions,
    arms,
    events: allEvents,
  };
}

/**
 * Convert arm configuration from StudyPlanner to ArmSchedule
 * Includes validation and safe defaults for edge cases
 */
export function armConfigToSchedule(
  armConfig: {
    name: string;
    species: string;
    subjects: number;
    armType: "treatment" | "placebo" | "comparator";
    doseLevel: number;
    doseUnit: string;
    duration: number;
    durationUnit: string;
    frequency: string;
    customFrequency?: {
      doses: number;
      period: number;
      unit: string;
    };
  },
  armId: string,
  volumeMl: number,
): ArmSchedule {
  // Convert duration to days with validation
  const daysPerUnit: Record<string, number> = {
    days: 1,
    weeks: 7,
    months: 30,
  };

  // Validate duration - ensure positive value
  const safeDuration = Math.max(0, armConfig.duration || 0);
  const unitMultiplier = daysPerUnit[armConfig.durationUnit] ?? 1;
  const durationDays = Math.max(1, Math.floor(safeDuration * unitMultiplier));

  // Convert frequency to FrequencyRule with validation
  let frequency: FrequencyRule;
  switch (armConfig.frequency) {
    case "once":
      // FIX: "once" should map to type "once", not "daily"
      // This ensures single-dose studies generate only 1 event, not daily events
      frequency = { type: "once", timesPerDay: 1 };
      break;
    case "twice":
      frequency = { type: "bid", timesPerDay: 2 };
      break;
    case "thrice":
      frequency = { type: "tid", timesPerDay: 3 };
      break;
    case "weekly":
      frequency = { type: "weekly", timesPerDay: 1 };
      break;
    case "biweekly":
      frequency = { type: "biweekly", timesPerDay: 1 };
      break;
    case "monthly":
      frequency = { type: "monthly", timesPerDay: 1 };
      break;
    case "custom":
      if (armConfig.customFrequency) {
        // Validate custom frequency parameters - prevent division by zero
        const safeDoses = Math.max(1, armConfig.customFrequency.doses || 1);
        const safePeriod = Math.max(1, armConfig.customFrequency.period || 1);
        const periodUnit = daysPerUnit[armConfig.customFrequency.unit] ?? 1;
        const periodDays = safePeriod * periodUnit;

        // Calculate interval ensuring it's at least 1
        const interval = Math.max(1, Math.round(periodDays / safeDoses));

        frequency = {
          type: "custom",
          interval,
          timesPerDay: safeDoses,
        };
      } else {
        frequency = { type: "daily", timesPerDay: 1 };
      }
      break;
    default:
      frequency = { type: "daily", timesPerDay: 1 };
  }

  // Generate subject prefix from species (all keys lowercase for lookup)
  const prefixMap: Record<string, string> = {
    mouse: "M",
    rat: "R",
    rabbit: "RB",
    dog: "D",
    beagle: "D",
    monkey: "NHP",
    cynomolgus: "NHP",
    human: "H",
    minipig: "P",
    "mini pig": "P",
  };

  // Safe species lookup
  const speciesKey = (armConfig.species || "").toLowerCase();
  const subjectPrefix = prefixMap[speciesKey] ?? "S";

  // Validate subjects count
  const safeSubjects = Math.max(1, Math.floor(armConfig.subjects || 1));

  return {
    armId: armId || "arm-unknown",
    armName: armConfig.name || "Unnamed Arm",
    armType: armConfig.armType || "treatment",
    subjects: safeSubjects,
    subjectPrefix,
    frequency,
    durationDays,
    doseAmount: Math.max(0, armConfig.doseLevel || 0),
    doseUnit: armConfig.doseUnit || "mg",
    volumeMl: Math.max(0, volumeMl || 0),
  };
}

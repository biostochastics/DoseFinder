/**
 * Calendar Export Functions
 *
 * Exports dosing schedules to CSV and ICS formats
 */

import type { DoseEvent, StudySchedule, ExportFormat } from "./types";

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Format a date for CSV export (YYYY-MM-DD)
 */
function formatDateForCSV(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format a time for CSV export (HH:MM)
 */
function formatTimeForCSV(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Escape a CSV field value
 */
function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate CSV content from study schedule
 */
export function generateCSV(schedule: StudySchedule): string {
  const headers = [
    "Date",
    "Time",
    "Study Day",
    "Subject",
    "Arm",
    "Arm Type",
    "Dose Amount",
    "Dose Unit",
    "Volume (mL)",
    "Notes",
  ];

  const rows: string[][] = [headers];

  for (const event of schedule.events) {
    const row = [
      formatDateForCSV(event.dateTime),
      formatTimeForCSV(event.dateTime),
      event.studyDay.toString(),
      event.subjectId,
      escapeCSVField(event.armName),
      event.armType,
      event.doseAmount.toString(),
      event.doseUnit,
      event.volumeMl.toFixed(3),
      escapeCSVField(event.notes ?? ""),
    ];
    rows.push(row);
  }

  return rows.map((row) => row.join(",")).join("\n");
}

// ============================================================================
// ICS Export
// ============================================================================

/**
 * Format a date for ICS (YYYYMMDDTHHMMSS)
 */
function formatDateForICS(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Format a date for ICS with timezone (for DTSTART;TZID=)
 */
function formatDateWithTimezone(date: Date, timezone: string): string {
  return `DTSTART;TZID=${timezone}:${formatDateForICS(date)}`;
}

/**
 * Generate UID for ICS event
 */
function generateUID(event: DoseEvent): string {
  return `${event.id}@dosefinder.app`;
}

/**
 * Escape text for ICS format (fold long lines, escape special chars)
 */
function escapeICSText(text: string): string {
  // Escape special characters
  let escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

  return escaped;
}

/**
 * Fold ICS lines to max 75 characters per RFC 5545
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }

  const result: string[] = [];
  let remaining = line;

  // First line can be 75 chars
  result.push(remaining.substring(0, 75));
  remaining = remaining.substring(75);

  // Continuation lines start with space, so 74 chars of content
  while (remaining.length > 0) {
    result.push(" " + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }

  return result.join("\r\n");
}

/**
 * Generate VTIMEZONE component for a timezone
 * Note: This is a simplified version; full VTIMEZONE would require tzdb data
 */
function generateVTimezone(timezone: string): string {
  // For simplicity, we'll use a basic VTIMEZONE
  // In production, you'd want to use a library like ical.js or moment-timezone
  return `BEGIN:VTIMEZONE
TZID:${timezone}
X-LIC-LOCATION:${timezone}
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
TZNAME:${timezone}
END:STANDARD
END:VTIMEZONE`;
}

/**
 * Generate a single VEVENT from a DoseEvent
 */
function generateVEvent(
  event: DoseEvent,
  studyName: string,
  durationMinutes: number,
  timezone: string,
): string {
  const endTime = new Date(event.dateTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);

  const summary = `${studyName}: ${event.subjectId} - ${event.armName}`;
  const description = [
    `Study Day: ${event.studyDay}`,
    `Subject: ${event.subjectId}`,
    `Arm: ${event.armName} (${event.armType})`,
    `Dose: ${event.doseAmount} ${event.doseUnit}`,
    `Volume: ${event.volumeMl.toFixed(3)} mL`,
    event.notes ? `Notes: ${event.notes}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  const lines = [
    "BEGIN:VEVENT",
    `UID:${generateUID(event)}`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    formatDateWithTimezone(event.dateTime, timezone),
    `DTEND;TZID=${timezone}:${formatDateForICS(endTime)}`,
    foldLine(`SUMMARY:${escapeICSText(summary)}`),
    foldLine(`DESCRIPTION:${escapeICSText(description)}`),
    `CATEGORIES:Dosing,${event.armType}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ];

  return lines.join("\r\n");
}

/**
 * Generate ICS content from study schedule
 */
export function generateICS(schedule: StudySchedule): string {
  const { studyName, options, events } = schedule;

  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DoseFinder//Dose Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICSText(studyName)} Dosing Schedule`,
    generateVTimezone(options.timezone),
  ].join("\r\n");

  const vevents = events
    .map((event) =>
      generateVEvent(
        event,
        studyName,
        options.durationMinutes,
        options.timezone,
      ),
    )
    .join("\r\n");

  const footer = "END:VCALENDAR";

  return `${header}\r\n${vevents}\r\n${footer}`;
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Export schedule to specified format
 */
export function exportSchedule(
  schedule: StudySchedule,
  format: ExportFormat,
): string {
  switch (format) {
    case "csv":
      return generateCSV(schedule);
    case "ics":
      return generateICS(schedule);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "text/csv";
    case "ics":
      return "text/calendar";
    default:
      return "application/octet-stream";
  }
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "csv";
    case "ics":
      return "ics";
    default:
      return "txt";
  }
}

/**
 * Generate filename for export
 */
export function generateFilename(
  studyName: string,
  format: ExportFormat,
): string {
  // Sanitize study name for filename
  const sanitized = studyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const date = new Date().toISOString().split("T")[0];
  return `${sanitized}-dosing-schedule-${date}.${getFileExtension(format)}`;
}

/**
 * Trigger file download in browser
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download schedule
 */
export function downloadSchedule(
  schedule: StudySchedule,
  format: ExportFormat,
): void {
  const content = exportSchedule(schedule, format);
  const filename = generateFilename(schedule.studyName, format);
  const mimeType = getMimeType(format);

  downloadFile(content, filename, mimeType);
}

/**
 * Get schedule statistics for display
 */
export function getScheduleStats(schedule: StudySchedule): {
  totalEvents: number;
  totalSubjects: number;
  totalDays: number;
  eventsByArm: Record<string, number>;
  startDate: Date | null;
  endDate: Date | null;
} {
  const events = schedule.events;

  if (events.length === 0) {
    return {
      totalEvents: 0,
      totalSubjects: 0,
      totalDays: 0,
      eventsByArm: {},
      startDate: null,
      endDate: null,
    };
  }

  const subjects = new Set(events.map((e) => e.subjectId));
  const studyDays = new Set(events.map((e) => e.studyDay));
  const eventsByArm: Record<string, number> = {};

  for (const event of events) {
    eventsByArm[event.armName] = (eventsByArm[event.armName] || 0) + 1;
  }

  const sortedDates = events
    .map((e) => e.dateTime)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    totalEvents: events.length,
    totalSubjects: subjects.size,
    totalDays: studyDays.size,
    eventsByArm,
    startDate: sortedDates[0],
    endDate: sortedDates[sortedDates.length - 1],
  };
}

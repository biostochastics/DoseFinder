/**
 * Tests for Calendar Module
 *
 * Tests schedule generation and export functionality
 */

import { describe, expect, it, vi } from "vitest";
import {
  generateStudySchedule,
  armConfigToSchedule,
  generateCSV,
  generateICS,
  exportSchedule,
  getMimeType,
  getFileExtension,
  generateFilename,
  getScheduleStats,
} from "./index";
import type { ArmSchedule, StudySchedule } from "./types";

// ============================================================================
// Test Data
// ============================================================================

const testArm: ArmSchedule = {
  armId: "arm1",
  armName: "Treatment A",
  armType: "treatment",
  subjects: 2,
  subjectPrefix: "M",
  frequency: { type: "daily", timesPerDay: 1 },
  durationDays: 3,
  doseAmount: 10,
  doseUnit: "mg/kg",
  volumeMl: 0.2,
};

const placeboArm: ArmSchedule = {
  armId: "arm2",
  armName: "Placebo",
  armType: "placebo",
  subjects: 1,
  subjectPrefix: "M",
  frequency: { type: "daily", timesPerDay: 1 },
  durationDays: 3,
  doseAmount: 0,
  doseUnit: "mg/kg",
  volumeMl: 0.2,
};

// ============================================================================
// Generator Tests
// ============================================================================

describe("generateStudySchedule", () => {
  it("generates schedule with correct structure", () => {
    const schedule = generateStudySchedule("Test Study", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    expect(schedule.studyName).toBe("Test Study");
    expect(schedule.arms).toHaveLength(1);
    expect(schedule.events.length).toBeGreaterThan(0);
  });

  it("generates correct number of events for single subject", () => {
    const singleSubjectArm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 5,
    };

    const schedule = generateStudySchedule("Test", [singleSubjectArm], {
      startDate: new Date("2025-01-06"),
    });

    // 1 subject × 5 days × 1 dose/day = 5 events
    expect(schedule.events).toHaveLength(5);
  });

  it("generates correct number of events for BID dosing", () => {
    const bidArm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 3,
      frequency: { type: "bid", timesPerDay: 2 },
    };

    const schedule = generateStudySchedule("Test", [bidArm], {
      startDate: new Date("2025-01-06"),
    });

    // 1 subject × 3 days × 2 doses/day = 6 events
    expect(schedule.events).toHaveLength(6);
  });

  it("generates correct number of events for TID dosing", () => {
    const tidArm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 2,
      frequency: { type: "tid", timesPerDay: 3 },
    };

    const schedule = generateStudySchedule("Test", [tidArm], {
      startDate: new Date("2025-01-06"),
    });

    // 1 subject × 2 days × 3 doses/day = 6 events
    expect(schedule.events).toHaveLength(6);
  });

  it("generates events for multiple subjects", () => {
    const multiSubjectArm: ArmSchedule = {
      ...testArm,
      subjects: 3,
      durationDays: 2,
    };

    const schedule = generateStudySchedule("Test", [multiSubjectArm], {
      startDate: new Date("2025-01-06"),
    });

    // 3 subjects × 2 days × 1 dose/day = 6 events
    expect(schedule.events).toHaveLength(6);
  });

  it("combines events from multiple arms", () => {
    const schedule = generateStudySchedule("Test", [testArm, placeboArm], {
      startDate: new Date("2025-01-06"),
    });

    // testArm: 2 subjects × 3 days = 6
    // placeboArm: 1 subject × 3 days = 3
    // Total = 9
    expect(schedule.events).toHaveLength(9);
  });

  it("sets dose to 0 for placebo arms", () => {
    const schedule = generateStudySchedule("Test", [placeboArm], {
      startDate: new Date("2025-01-06"),
    });

    schedule.events.forEach((event) => {
      expect(event.doseAmount).toBe(0);
    });
  });

  it("sorts events chronologically", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    for (let i = 1; i < schedule.events.length; i++) {
      expect(schedule.events[i].dateTime.getTime()).toBeGreaterThanOrEqual(
        schedule.events[i - 1].dateTime.getTime(),
      );
    }
  });

  it("generates unique event IDs", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const ids = schedule.events.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("uses default options when not specified", () => {
    const schedule = generateStudySchedule("Test", [testArm]);

    expect(schedule.options.skipWeekends).toBe(false);
    expect(schedule.options.skipHolidays).toBe(false);
    expect(schedule.options.defaultTime).toBe("09:00");
  });

  it("skips weekends when configured", () => {
    const arm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 7,
    };

    const schedule = generateStudySchedule("Test", [arm], {
      startDate: new Date("2025-01-06"), // Monday
      skipWeekends: true,
    });

    // Check no events on Saturday/Sunday
    schedule.events.forEach((event) => {
      const dayOfWeek = event.dateTime.getDay();
      expect(dayOfWeek).not.toBe(0); // Not Sunday
      expect(dayOfWeek).not.toBe(6); // Not Saturday
    });
  });

  it("marks first dose with note", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const firstDayEvents = schedule.events.filter((e) => e.studyDay === 1);
    expect(firstDayEvents.some((e) => e.notes === "First dose")).toBe(true);
  });

  it("handles weekly frequency", () => {
    // Create start date with explicit time to avoid timezone issues
    const startDate = new Date(2025, 0, 6, 9, 0, 0); // January 6, 2025, 9 AM local
    const startDayOfWeek = startDate.getDay();

    const weeklyArm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 21, // 3 weeks
      frequency: { type: "weekly", timesPerDay: 1 },
    };

    const schedule = generateStudySchedule("Test", [weeklyArm], {
      startDate,
    });

    // 3 weeks = 3 doses
    expect(schedule.events).toHaveLength(3);

    // All events should be on same day of week as start
    schedule.events.forEach((event) => {
      expect(event.dateTime.getDay()).toBe(startDayOfWeek);
    });
  });

  it("handles once frequency", () => {
    const onceArm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 7,
      frequency: { type: "once", timesPerDay: 1 },
    };

    const schedule = generateStudySchedule("Test", [onceArm], {
      startDate: new Date("2025-01-06"),
    });

    expect(schedule.events).toHaveLength(1);
    expect(schedule.events[0].studyDay).toBe(1);
  });
});

describe("armConfigToSchedule", () => {
  it("converts arm config to schedule format", () => {
    const config = {
      name: "Treatment A",
      species: "mouse",
      subjects: 5,
      armType: "treatment" as const,
      doseLevel: 10,
      doseUnit: "mg/kg",
      duration: 2,
      durationUnit: "weeks",
      frequency: "once",
    };

    const result = armConfigToSchedule(config, "arm1", 0.2);

    expect(result.armId).toBe("arm1");
    expect(result.armName).toBe("Treatment A");
    expect(result.subjects).toBe(5);
    expect(result.subjectPrefix).toBe("M");
    expect(result.durationDays).toBe(14); // 2 weeks
    expect(result.volumeMl).toBe(0.2);
  });

  it("maps species to correct subject prefix", () => {
    const testCases = [
      { species: "mouse", prefix: "M" },
      { species: "rat", prefix: "R" },
      { species: "rabbit", prefix: "RB" },
      { species: "dog", prefix: "D" },
      { species: "beagle", prefix: "D" },
      { species: "monkey", prefix: "NHP" },
      { species: "cynomolgus", prefix: "NHP" },
      { species: "human", prefix: "H" },
      { species: "minipig", prefix: "P" },
      { species: "MiniPig", prefix: "P" }, // Case insensitive
      { species: "unknown", prefix: "S" },
    ];

    testCases.forEach(({ species, prefix }) => {
      const result = armConfigToSchedule(
        {
          name: "Test",
          species,
          subjects: 1,
          armType: "treatment",
          doseLevel: 10,
          doseUnit: "mg/kg",
          duration: 1,
          durationUnit: "days",
          frequency: "once",
        },
        "arm1",
        0.1,
      );
      expect(result.subjectPrefix).toBe(prefix);
    });
  });

  it("converts frequency types correctly", () => {
    const testCases = [
      { frequency: "once", expectedType: "once" }, // FIX: "once" should map to "once", not "daily"
      { frequency: "twice", expectedType: "bid" },
      { frequency: "thrice", expectedType: "tid" },
      { frequency: "weekly", expectedType: "weekly" },
      { frequency: "biweekly", expectedType: "biweekly" },
      { frequency: "monthly", expectedType: "monthly" },
    ];

    testCases.forEach(({ frequency, expectedType }) => {
      const result = armConfigToSchedule(
        {
          name: "Test",
          species: "mouse",
          subjects: 1,
          armType: "treatment",
          doseLevel: 10,
          doseUnit: "mg/kg",
          duration: 1,
          durationUnit: "days",
          frequency,
        },
        "arm1",
        0.1,
      );
      expect(result.frequency.type).toBe(expectedType);
    });
  });

  it("handles custom frequency", () => {
    const result = armConfigToSchedule(
      {
        name: "Test",
        species: "mouse",
        subjects: 1,
        armType: "treatment",
        doseLevel: 10,
        doseUnit: "mg/kg",
        duration: 1,
        durationUnit: "weeks",
        frequency: "custom",
        customFrequency: {
          doses: 3,
          period: 1,
          unit: "weeks",
        },
      },
      "arm1",
      0.1,
    );

    expect(result.frequency.type).toBe("custom");
    expect(result.frequency.interval).toBe(2); // 7 days / 3 doses ≈ 2
  });
});

// ============================================================================
// CSV Export Tests
// ============================================================================

describe("generateCSV", () => {
  it("generates valid CSV header", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const csv = generateCSV(schedule);
    const lines = csv.split("\n");

    expect(lines[0]).toBe(
      "Date,Time,Study Day,Subject,Arm,Arm Type,Dose Amount,Dose Unit,Volume (mL),Notes",
    );
  });

  it("generates correct number of data rows", () => {
    const arm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 3,
    };

    const schedule = generateStudySchedule("Test", [arm], {
      startDate: new Date("2025-01-06"),
    });

    const csv = generateCSV(schedule);
    const lines = csv.split("\n");

    // Header + 3 data rows
    expect(lines).toHaveLength(4);
  });

  it("formats dates correctly", () => {
    // Use explicit local time to avoid timezone issues
    const startDate = new Date(2025, 0, 6, 9, 0, 0); // Jan 6, 2025, 9 AM local
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate,
    });

    const csv = generateCSV(schedule);
    const lines = csv.split("\n");
    const firstDataRow = lines[1].split(",");

    // First event date should match start date in local format
    const expectedDate = startDate.toISOString().split("T")[0];
    expect(firstDataRow[0]).toBe(expectedDate);
  });

  it("escapes fields with commas", () => {
    const armWithComma: ArmSchedule = {
      ...testArm,
      armName: "Treatment A, High Dose",
    };

    const schedule = generateStudySchedule("Test", [armWithComma], {
      startDate: new Date("2025-01-06"),
    });

    const csv = generateCSV(schedule);
    expect(csv).toContain('"Treatment A, High Dose"');
  });

  it("escapes fields with quotes", () => {
    const armWithQuote: ArmSchedule = {
      ...testArm,
      armName: 'Treatment "A"',
    };

    const schedule = generateStudySchedule("Test", [armWithQuote], {
      startDate: new Date("2025-01-06"),
    });

    const csv = generateCSV(schedule);
    expect(csv).toContain('"Treatment ""A"""');
  });
});

// ============================================================================
// ICS Export Tests
// ============================================================================

describe("generateICS", () => {
  it("generates valid ICS header", () => {
    const schedule = generateStudySchedule("Test Study", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const ics = generateICS(schedule);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//DoseFinder//Dose Calendar//EN");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("includes VTIMEZONE component", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const ics = generateICS(schedule);

    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("END:VTIMEZONE");
  });

  it("generates VEVENT for each dose event", () => {
    const arm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 3,
    };

    const schedule = generateStudySchedule("Test", [arm], {
      startDate: new Date("2025-01-06"),
    });

    const ics = generateICS(schedule);

    // Count VEVENT occurrences
    const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(veventCount).toBe(3);
  });

  it("includes correct event properties", () => {
    const schedule = generateStudySchedule("Test Study", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const ics = generateICS(schedule);

    expect(ics).toContain("UID:");
    expect(ics).toContain("DTSTAMP:");
    expect(ics).toContain("DTSTART;TZID=");
    expect(ics).toContain("DTEND;TZID=");
    expect(ics).toContain("SUMMARY:");
    expect(ics).toContain("DESCRIPTION:");
  });

  it("includes study name in calendar name", () => {
    const schedule = generateStudySchedule("My Preclinical Study", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const ics = generateICS(schedule);

    expect(ics).toContain("X-WR-CALNAME:My Preclinical Study Dosing Schedule");
  });

  it("includes dose information in description", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date(2025, 0, 6, 9, 0, 0),
    });

    const ics = generateICS(schedule);

    // Check for dose info - ICS escapes colons with backslash and may fold lines
    // The description contains "Dose: 10 mg/kg" escaped as "Dose\\: 10 mg/kg"
    expect(ics).toContain("DESCRIPTION:");
    expect(ics).toContain("Study Day");
    expect(ics).toContain("mg/kg"); // Dose unit
    expect(ics).toContain("mL"); // Volume unit
  });
});

// ============================================================================
// Export Utility Tests
// ============================================================================

describe("exportSchedule", () => {
  it("exports to CSV format", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const result = exportSchedule(schedule, "csv");
    expect(result).toContain("Date,Time,Study Day");
  });

  it("exports to ICS format", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const result = exportSchedule(schedule, "ics");
    expect(result).toContain("BEGIN:VCALENDAR");
  });

  it("throws for unsupported format", () => {
    const schedule = generateStudySchedule("Test", [testArm]);

    expect(() => exportSchedule(schedule, "pdf" as never)).toThrow(
      "Unsupported export format",
    );
  });
});

describe("getMimeType", () => {
  it("returns correct MIME type for CSV", () => {
    expect(getMimeType("csv")).toBe("text/csv");
  });

  it("returns correct MIME type for ICS", () => {
    expect(getMimeType("ics")).toBe("text/calendar");
  });
});

describe("getFileExtension", () => {
  it("returns csv for CSV format", () => {
    expect(getFileExtension("csv")).toBe("csv");
  });

  it("returns ics for ICS format", () => {
    expect(getFileExtension("ics")).toBe("ics");
  });
});

describe("generateFilename", () => {
  it("generates sanitized filename", () => {
    const filename = generateFilename("My Study Name", "csv");
    expect(filename).toMatch(
      /^my-study-name-dosing-schedule-\d{4}-\d{2}-\d{2}\.csv$/,
    );
  });

  it("removes special characters", () => {
    const filename = generateFilename("Study #1 (Test)", "ics");
    expect(filename).toMatch(/^study-1-test-dosing-schedule-.*\.ics$/);
  });

  it("uses correct extension", () => {
    expect(generateFilename("Test", "csv")).toContain(".csv");
    expect(generateFilename("Test", "ics")).toContain(".ics");
  });
});

describe("getScheduleStats", () => {
  it("calculates correct statistics", () => {
    const schedule = generateStudySchedule("Test", [testArm, placeboArm], {
      startDate: new Date(2025, 0, 6, 9, 0, 0),
    });

    const stats = getScheduleStats(schedule);

    // testArm: 2 subjects × 3 days = 6
    // placeboArm: 1 subject × 3 days = 3
    expect(stats.totalEvents).toBe(9);
    // Both arms use prefix "M", so M001 appears in both arms
    // Unique subjects: M001 (both arms), M002 (treatment only) = 2 unique IDs
    expect(stats.totalSubjects).toBe(2);
    expect(stats.totalDays).toBe(3);
    expect(stats.eventsByArm["Treatment A"]).toBe(6);
    expect(stats.eventsByArm["Placebo"]).toBe(3);
  });

  it("handles empty schedule", () => {
    const emptySchedule: StudySchedule = {
      studyName: "Empty",
      options: {
        startDate: new Date(),
        skipWeekends: false,
        skipHolidays: false,
        holidays: [],
        timezone: "UTC",
        defaultTime: "09:00",
        durationMinutes: 15,
      },
      arms: [],
      events: [],
    };

    const stats = getScheduleStats(emptySchedule);

    expect(stats.totalEvents).toBe(0);
    expect(stats.totalSubjects).toBe(0);
    expect(stats.totalDays).toBe(0);
    expect(stats.startDate).toBeNull();
    expect(stats.endDate).toBeNull();
  });

  it("returns correct date range", () => {
    const schedule = generateStudySchedule("Test", [testArm], {
      startDate: new Date("2025-01-06"),
    });

    const stats = getScheduleStats(schedule);

    expect(stats.startDate).not.toBeNull();
    expect(stats.endDate).not.toBeNull();
    expect(stats.startDate!.getTime()).toBeLessThanOrEqual(
      stats.endDate!.getTime(),
    );
  });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe("Edge Cases - generateStudySchedule", () => {
  it("handles zero duration gracefully", () => {
    const zeroDurationArm: ArmSchedule = {
      ...testArm,
      durationDays: 0,
    };

    const schedule = generateStudySchedule("Test", [zeroDurationArm], {
      startDate: new Date("2025-01-06"),
    });

    expect(schedule.events).toHaveLength(0);
  });

  it("handles negative duration gracefully", () => {
    const negativeDurationArm: ArmSchedule = {
      ...testArm,
      durationDays: -5,
    };

    const schedule = generateStudySchedule("Test", [negativeDurationArm], {
      startDate: new Date("2025-01-06"),
    });

    expect(schedule.events).toHaveLength(0);
  });

  it("handles zero subjects gracefully", () => {
    const zeroSubjectsArm: ArmSchedule = {
      ...testArm,
      subjects: 0,
    };

    const schedule = generateStudySchedule("Test", [zeroSubjectsArm], {
      startDate: new Date("2025-01-06"),
    });

    expect(schedule.events).toHaveLength(0);
  });

  it("handles invalid start date gracefully", () => {
    // Suppress expected warning for this edge case test
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const schedule = generateStudySchedule("Test", [testArm], {
        startDate: new Date("invalid-date"),
      });

      // Should fall back to current date and generate events
      expect(schedule.events.length).toBeGreaterThan(0);
      // Events should have valid dates
      schedule.events.forEach((event) => {
        expect(isNaN(event.dateTime.getTime())).toBe(false);
      });

      // Verify warning was called
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid start date provided, using current date",
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("handles monthly frequency for Jan 31 start date", () => {
    // Edge case: start on Jan 31, should dose on Feb 28/29 (last day of Feb)
    const monthlyArm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 35, // Just over 1 month to get Jan 31 + Feb 28
      frequency: { type: "monthly", timesPerDay: 1 },
    };

    const schedule = generateStudySchedule("Test", [monthlyArm], {
      startDate: new Date(2025, 0, 31, 9, 0, 0), // Jan 31, 2025
    });

    // Should have 2 doses (Jan 31 and Feb 28)
    expect(schedule.events).toHaveLength(2);

    // First dose should be Jan 31
    const firstEvent = schedule.events[0];
    expect(firstEvent.dateTime.getMonth()).toBe(0); // January
    expect(firstEvent.dateTime.getDate()).toBe(31);

    // Second dose should be Feb 28 (last day of Feb 2025, since Feb doesn't have 31 days)
    const secondEvent = schedule.events[1];
    expect(secondEvent.dateTime.getMonth()).toBe(1); // February
    expect(secondEvent.dateTime.getDate()).toBe(28); // Last day of Feb 2025
  });

  it("handles large duration without memory issues", () => {
    const longArm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 3650, // 10 years - maximum allowed
      frequency: { type: "monthly", timesPerDay: 1 },
    };

    const schedule = generateStudySchedule("Test", [longArm], {
      startDate: new Date("2025-01-06"),
    });

    // Should complete without hanging and produce reasonable number of events
    // 10 years * 12 months = ~120 events
    expect(schedule.events.length).toBeLessThanOrEqual(200);
  });

  it("prevents infinite loop when all days are holidays", () => {
    // Suppress expected warning for this edge case test
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Create a schedule where we try to skip all dates
    const arm: ArmSchedule = {
      ...testArm,
      subjects: 1,
      durationDays: 7,
    };

    // Generate a year's worth of holidays to test the safety limit
    const holidays: Date[] = [];
    for (let i = 0; i < 400; i++) {
      const date = new Date("2025-01-01");
      date.setDate(date.getDate() + i);
      holidays.push(date);
    }

    const schedule = generateStudySchedule("Test", [arm], {
      startDate: new Date("2025-01-06"),
      skipWeekends: true,
      skipHolidays: true,
      holidays,
    });

    // Should complete without hanging (safety limit kicks in)
    // The schedule may have events or be empty depending on safety behavior
    expect(schedule).toBeDefined();

    // Verify warning was called about the safety limit
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("Edge Cases - armConfigToSchedule", () => {
  it("handles zero duration", () => {
    const result = armConfigToSchedule(
      {
        name: "Test",
        species: "mouse",
        subjects: 1,
        armType: "treatment",
        doseLevel: 10,
        doseUnit: "mg/kg",
        duration: 0,
        durationUnit: "days",
        frequency: "once",
      },
      "arm1",
      0.1,
    );

    expect(result.durationDays).toBe(1); // Should clamp to minimum of 1
  });

  it("handles negative values", () => {
    const result = armConfigToSchedule(
      {
        name: "Test",
        species: "mouse",
        subjects: -5,
        armType: "treatment",
        doseLevel: -10,
        doseUnit: "mg/kg",
        duration: -1,
        durationUnit: "days",
        frequency: "once",
      },
      "arm1",
      -0.1,
    );

    expect(result.subjects).toBe(1); // Clamped to minimum
    expect(result.doseAmount).toBe(0); // Clamped to 0
    expect(result.durationDays).toBe(1); // Clamped to minimum
    expect(result.volumeMl).toBe(0); // Clamped to 0
  });

  it("handles custom frequency with zero period", () => {
    const result = armConfigToSchedule(
      {
        name: "Test",
        species: "mouse",
        subjects: 1,
        armType: "treatment",
        doseLevel: 10,
        doseUnit: "mg/kg",
        duration: 7,
        durationUnit: "days",
        frequency: "custom",
        customFrequency: {
          doses: 0,
          period: 0,
          unit: "days",
        },
      },
      "arm1",
      0.1,
    );

    // Should not throw and should have reasonable defaults
    expect(result.frequency.type).toBe("custom");
    expect(result.frequency.interval).toBeGreaterThanOrEqual(1);
  });

  it("handles missing species", () => {
    const result = armConfigToSchedule(
      {
        name: "Test",
        species: "",
        subjects: 1,
        armType: "treatment",
        doseLevel: 10,
        doseUnit: "mg/kg",
        duration: 1,
        durationUnit: "days",
        frequency: "once",
      },
      "arm1",
      0.1,
    );

    expect(result.subjectPrefix).toBe("S"); // Default prefix
  });

  it("handles unknown duration unit", () => {
    const result = armConfigToSchedule(
      {
        name: "Test",
        species: "mouse",
        subjects: 1,
        armType: "treatment",
        doseLevel: 10,
        doseUnit: "mg/kg",
        duration: 7,
        durationUnit: "unknown" as "days" | "weeks" | "months",
        frequency: "once",
      },
      "arm1",
      0.1,
    );

    // Should fall back to treating as days
    expect(result.durationDays).toBe(7);
  });
});

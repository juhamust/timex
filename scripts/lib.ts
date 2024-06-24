/**
 * This module processes the JSON file generated by
 * the export.jxa into temporary folder. The location
 * of the file is given as argument. Example:
 *
 * node scripts/process.js ./tmp/output.json
 */
import * as jsonfile from "jsonfile";
import { parse, format } from "date-fns";
import * as groupby from "lodash.groupby";
import { red, blue, yellow, green, bold, gray, white } from "colorette";
import {
  ParsedDuration,
  Export,
  ExportEntry,
  Duration,
  TimeEntry,
  Summary,
  SummaryEntry,
  ProjectEntries,
  ProjectEntry,
  TimeEntries,
  FormatOptions,
} from "./interfaces";

export function parseDuration(rawValue): ParsedDuration {
  const decimalValue = parseFloat((rawValue / 3600).toString());
  const hours = parseInt(decimalValue.toString(), 10);
  const minutes = parseInt(((decimalValue % 1) * 60).toFixed(0), 10);

  return {
    hours,
    minutes,
  };
}

/**
 * Generates printable version from summary info
 * @param summary
 */
export function formatSummary(
  summary: Summary,
  opts: FormatOptions = { oneLiner: true, exportFormat: "json" }
): string {
  const output: string[] = [];
  //return JSON.stringify(summary)
  summary.forEach((summaryEntry) => {
    const weekDay: string = format(summaryEntry.date, "ddd");
    const dayKey: string = format(summaryEntry.date, "YYYY-MM-DD");
    const decimalHours = formatDecimalHours(summaryEntry.roundedDuration);
    output.push(
      `[ ${bold(red(weekDay.toLocaleUpperCase()))} ${dayKey} / ${green(
        decimalHours
      )} ]`
    );

    // Iterate all projects within day
    summaryEntry.projects.forEach((projectEntry) => {
      const roundedDecimalHours = formatDecimalHours(
        projectEntry.roundedDuration
      );

      // Print each task on same line and simple format
      if (opts.oneLiner) {
        const timeEntries = projectEntry.timeEntries.map((task) => {
          const roundedHours = formatDecimalHours(task.roundedDuration);
          return `${white(task.title)}: ${green(roundedHours)}`;
        });
        output.push(
          `  - ${yellow(projectEntry.title)}: ${red(
            roundedDecimalHours
          )} = ${timeEntries.join(" | ")}`
        );
      }
      // Print each task on own line
      else {
        output.push(
          `  - ${yellow(projectEntry.title)}: ${red(roundedDecimalHours)}`
        );

        // Iterate all timeEntries within project/day
        projectEntry.timeEntries.forEach((task) => {
          const actualHours = formatHours(task.actualDuration);
          const roundedHours = formatDecimalHours(task.roundedDuration);
          output.push(
            `    ${gray(">>")} ${blue(task.title)}: ${red(roundedHours)} ${gray(
              `(${actualHours})`
            )}`
          );
        });
      }
    });

    output.push("");
  });

  return output.join("\n");
}

export function formatDecimalHours(rawValue) {
  const hours = parseFloat((rawValue / 3600).toString()).toFixed(2);
  return `${hours} hrs`;
}

export function formatHours(rawValue) {
  const parsed = parseDuration(rawValue);
  return `${parsed.hours}:${
    parsed.minutes < 10 ? `0${parsed.minutes}` : parsed.minutes
  }`;
}

export function formatRoundHours(rawValue) {
  const parsed = parseDuration(rawValue);
  if (parsed.minutes < 15) {
    parsed.minutes = 0;
  } else if (parsed.minutes >= 15 && parsed.minutes < 30) {
    parsed.minutes = 30;
  } else if (parsed.minutes >= 30 && parsed.minutes < 45) {
    parsed.minutes = 30;
  } else if (parsed.minutes >= 45) {
    parsed.hours += 1;
    parsed.minutes = 0;
  }
  return `${parsed.hours},${(parsed.minutes * 100) / 60}`;
}

export function filterEntry(entry): boolean {
  if (entry.project.toLocaleLowerCase().indexOf("personal") !== -1) {
    return false;
  }
  return true;
}

export function filterProject(projectName: string): boolean {
  if (projectName.toLocaleLowerCase().indexOf("personal") !== -1) {
    return false;
  }
  return true;
}

export function roundDuration(duration: number): ParsedDuration {
  const parsedDuration = parseDuration(duration);
  let roundedHours: number = parsedDuration.hours;
  let roundedMinutes: number = 0;

  if (parsedDuration.minutes >= 0 && parsedDuration.minutes < 15) {
    roundedMinutes = 0;
  }
  if (parsedDuration.minutes >= 15 && parsedDuration.minutes < 45) {
    roundedMinutes = 30;
  }
  if (parsedDuration.minutes > 45) {
    roundedHours += 1;
    roundedMinutes = 0;
  }

  return {
    hours: roundedHours,
    minutes: roundedMinutes,
  };
}

export async function processFile(inputPath): Promise<Summary> {
  const data: Export = await jsonfile.readFile(inputPath);
  const grouper = (entry: ExportEntry) => {
    return format(entry.startDate, "YYYY-MM-DD");
  };
  const groupedByDate = groupby(data, grouper);

  // Iterate all days
  const summary: Summary = Object.keys(groupedByDate).map((dayKey) => {
    const groupedByProject = groupby(groupedByDate[dayKey], "project");
    const date = parse(dayKey);

    // Iterate time entries per day/project
    const projectEntries = Object.keys(groupedByProject)
      .filter(filterProject)
      .map((projectKey) => {
        let dayProjects = [];

        // Iterate all time entries withing project
        const groupedByActivity = groupby(
          groupedByProject[projectKey].filter(filterEntry),
          "activityTitle"
        );
        // Iterate all tasks within day
        Object.keys(groupedByActivity).forEach((activityKey) => {
          const durationSum = groupedByActivity[activityKey].reduce(
            (prevValue, timeEntry) => prevValue + timeEntry.duration || 0,
            0
          );
          dayProjects.push({
            activityKey,
            duration: durationSum,
          });
        });

        const timeEntries: TimeEntries = dayProjects.map((dayProjectEntry) => {
          const roundedDuration = roundDuration(dayProjectEntry.duration);
          //const decimalHours = formatDecimalHours(dayProjectEntry.duration)
          //const hours = formatHours(dayProjectEntry.duration)
          //const roundedHours = formatRoundHours(dayProjectEntry.duration)
          //outputLines.push(`    ${gray('>>')} ${dayProjectEntry.activityKey}: : ${green(decimalHours)} ${gray('/')} ${blue(hours)} ${gray('/')} ${red(roundHours + ' hrs')}`)

          return {
            title: dayProjectEntry.activityKey,
            actualDuration: dayProjectEntry.duration,
            roundedDuration:
              roundedDuration.hours * 3600 + roundedDuration.minutes * 60,
          } as TimeEntry;
        });

        // Calculate sums for project and day, using rounded values
        const actualDuration: Duration = timeEntries.reduce(
          (totalDuration: number, timeEntry: TimeEntry) =>
            totalDuration + timeEntry.actualDuration,
          0
        );
        const roundedDuration: Duration = timeEntries.reduce(
          (totalDuration: number, timeEntry: TimeEntry) =>
            totalDuration + timeEntry.roundedDuration,
          0
        );

        return {
          date,
          title: projectKey,
          actualDuration,
          roundedDuration,
          timeEntries,
        } as ProjectEntry;
      }) as ProjectEntries;

    return {
      date,
      actualDuration: projectEntries.reduce(
        (totalDuration: number, entry: ProjectEntry) =>
          totalDuration + entry.actualDuration,
        0
      ),
      roundedDuration: projectEntries.reduce(
        (totalDuration: number, entry: ProjectEntry) =>
          totalDuration + entry.roundedDuration,
        0
      ),
      projects: projectEntries,
    } as SummaryEntry;
  }) as Summary;

  return summary;
}

export interface FormatOptions {
  oneLiner: boolean;
  exportFormat: ExportFormat;
}

export type ExportFormat = "json" | "csv";

export interface ExportEntry {
  id: string;
  project: string;
  activityTitle: string;
  startDate: string;
  endDate: string;
  duration: number;
}

export interface Export extends Array<ExportEntry> {}

export interface ExportByDate {}

export interface TimeEntry {
  date: Date;
  title: string;
  actualDuration: number;
  roundedDuration: number;
}

export interface TimeEntries extends Array<TimeEntry> {}

export interface ProjectEntry {
  title: string;
  actualDuration: number;
  roundedDuration: number;
  timeEntries: TimeEntry[];
}

export interface ProjectEntries extends Array<ProjectEntry> {}

export interface SummaryEntry {
  date: Date;
  title: string;
  actualDuration: number;
  roundedDuration: number;
  projects: ProjectEntries;
}

export interface Summary extends Array<SummaryEntry> {}

export type Duration = number;

export interface ParsedDuration {
  hours: Duration;
  minutes: Duration;
}

/**
 * Script provides the CLI interface for the library.
 * Usage:
 *  ts-node scripts/process.ts ./tmp/output.json
 */
import * as path from "path";
import { processFile, formatSummary } from "./lib";
import { ExportFormat } from "./interfaces";

export async function main() {
  const args = process.argv;
  if (args.length !== 3) {
    return process.exit(-1);
  }

  const inputPath = args[args.length - 1];
  const outputFormat = path.extname(inputPath).replace(".", "");
  if (!isExportFormat(outputFormat)) {
    console.error(
      "Invalid file format:",
      outputFormat,
      "(Only .json and .csv are supported)"
    );
    return process.exit(-1);
  }
  const summary = await processFile(path.join(__dirname, "..", inputPath));
  console.log(
    formatSummary(summary, { oneLiner: true, exportFormat: outputFormat })
  );
}

function isExportFormat(format: string): format is ExportFormat {
  return ["json", "csv"].includes(format);
}

main();

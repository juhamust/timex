import * as path from "path";
import { processFile, formatSummary } from "./lib";

export async function main() {
  const args = process.argv;
  if (args.length !== 3) {
    return process.exit(-1);
  }

  const inputPath = args[args.length - 1];
  const summary = await processFile(path.join(__dirname, "..", inputPath));
  console.log(formatSummary(summary, { oneLiner: true }));
}

main();

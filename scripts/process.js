const fs = require('fs')
const path = require('path')
const jsonfile = require('jsonfile')
const { parse, format } = require('date-fns')
const groupby = require('lodash.groupby')

function formatNumber(rawValue) {
  const hours = parseFloat(rawValue/3600).toFixed(2)
  return `${hours} hrs`
}

async function processFile(inputPath) {
  let output = []

  try {
    const data = await jsonfile.readFile(inputPath)
    const grouper = entry => {
      return format(entry.startDate, 'YYYY-MM-DD')
    }
    const groupedByDate = groupby(data, grouper)

    // Iterate all days
    const dayOutput = Object.keys(groupedByDate).map(dayKey => {
      const groupedByProject = groupby(groupedByDate[dayKey], 'project')
      let dayOutput = []
      let weekDay = 'XYZ'
      let daySum = 0

      // Iterate time entries per day/project
      const projectOutput = Object.keys(groupedByProject).map(projectKey => {
        let dayProjectSum = 0
        let notes = []

        // Iterate all time entries withing project
        groupedByProject[projectKey].forEach(timeEntry => {
          weekDay = format(parse(timeEntry.startDate), 'ddd')
          dayProjectSum += timeEntry.duration || 0
          daySum += timeEntry.duration || 0
          const note = timeEntry.notes ? timeEntry.notes.split('\n').join(' / ') : null
          if (timeEntry.notes && note.indexOf('timing.eventID') === -1) {
            notes.push(note)
          }
        })
        const notePrint = notes.length > 0 ? `>>> ${notes.join(' ')}` : ''
        return `  - ${projectKey}: ${formatNumber(dayProjectSum)} ${notePrint}`
      })

      dayOutput.push(`[ ${weekDay.toLocaleUpperCase()} ${dayKey} (${formatNumber(daySum)}) ]`)
      dayOutput = dayOutput.concat(projectOutput)
      dayOutput.push('')

      return dayOutput.join('\n')
    })

    output = output.concat(dayOutput)
  }
  catch (error) {
    console.error(error);
  }

  console.log(output.join('\n'));
}

function main() {
  const args = process.argv
  if (args.length !== 3) {
    return process.exit(-1)
  }

  const inputPath = args[args.length - 1]
  processFile(path.join(__dirname, '..',  inputPath))
}


main()

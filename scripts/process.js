const path = require('path')
const jsonfile = require('jsonfile')
const { parse, format } = require('date-fns')
const groupby = require('lodash.groupby')

function formatDecimalHours(rawValue) {
  const hours = parseFloat(rawValue/3600).toFixed(2)
  return `${hours} hrs`
}

function formatHours(rawValue) {
  const decimalValue = parseFloat(rawValue / 3600)
  const hours = parseInt(decimalValue)
  const minutes = ((decimalValue % 1) * 60).toFixed(0)
  return `${hours}:${minutes < 10 ? `0${minutes}`: minutes }`
}

function filterEntry(entry) {
  if (entry.project.toLocaleLowerCase().indexOf('personal') !== -1) {
    return false
  }
  return true
}

function filterProject(projectName) {
  if (projectName.toLocaleLowerCase().indexOf('personal') !== -1) {
    return false
  }
  return true
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
      const projectOutput = Object.keys(groupedByProject).filter(filterProject).map(projectKey => {
        let dayProjectSum = 0
        let notes = []

        // Iterate all time entries withing project
        groupedByProject[projectKey].filter(filterEntry).forEach(timeEntry => {
          weekDay = format(parse(timeEntry.startDate), 'ddd')
          dayProjectSum += timeEntry.duration || 0
          daySum += timeEntry.duration || 0
          const note = timeEntry.notes ? timeEntry.notes.split('\n').join(' / ') : null
          if (timeEntry.notes && note.indexOf('timing.eventID') === -1) {
            notes.push(note)
          }
        })
        const notePrint = notes.length > 0 ? `--- ${notes.join(' / ')}` : ''
        const decimalHours = formatDecimalHours(dayProjectSum)
        const hours = formatHours(dayProjectSum)
        return `  - ${projectKey}: ${decimalHours} / ${hours} ${notePrint}`
      })

      const decimalHours = formatDecimalHours(daySum)
      const hours = formatHours(daySum)
      dayOutput.push(`[ ${weekDay.toLocaleUpperCase()} ${dayKey} (${decimalHours} / ${hours}) ]`)
      dayOutput = dayOutput.concat(projectOutput.sort())
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

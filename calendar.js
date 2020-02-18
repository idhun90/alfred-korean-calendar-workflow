function isDate(word) {
  const dayReg = /(^[0-9]|[0-1][0-2])\/([0-9]$|[3][0-1]|[0-2][0-9])/;
  return word.match(dayReg);
}

function isToday(word) {
  return word.match(/오늘|today/);
}

function isTomorrow(word) {
  return word.match(/내일|tomorrow/);
}

function isAfterDay(word) {
  return word.match(/([0-9]|[1-9][0-9])day$/);
}

function isTime(word) {
  const timeReg = /^([1-9]|[1][0-9]|[2][0-4])시$/;
  return word.match(timeReg);
}

function isTimeRange(word) {
  const timeReg = /^([1-9]|[1][0-9]|[2][0-4])-([1-9]|[1][0-9]|[2][0-4])시$/;
  return word.match(timeReg);
}

function getDateString(afterDayCount = 0) {
  const today = new Date();
  today.setDate(today.getDate() + afterDayCount);
  const month = today.getMonth() + 1;
  const date = today.getDate();
  return `${month}/${date}`;
}

function parseWordType(word) {
  if (isDate(word)) {
    return { type: 'date', value: word };
  } else if (isTomorrow(word)) {
    return { type: 'date', value: getDateString(1) };
  } else if (isToday(word)) {
    return { type: 'date', value: getDateString(0) };
  } else if (isAfterDay(word)) {
    const afterDay = parseInt(word.replace('day', ''), 10);
    return { type: 'date', value: getDateString(afterDay) };
  } else if (isTime(word)) {
    const hour = Number(word.replace('시', ''));
    const value = `${hour}-${hour + 1}`;
    return { type: 'time', value: value };
  } else if (isTimeRange(word)) {
    return { type: 'time', value: word.replace('시', '') };
  }
  return { type: 'title', value: word };
}

function getDateAndTitle(nl) {
  let time = undefined;
  const words = nl.map(parseWordType);
  const title = words
    .filter(word => word.type === 'title')
    .map(word => word.value)
    .join(' ');

  const date = words
    .filter(word => word.type === 'date')
    .map(word => word.value)
    .slice(0, 2);

  const timeRange = words
    .filter(word => word.type === 'time')
    .map(word => word.value)
    .slice(0, 1);

  if (timeRange.length) {
    time = timeRange[0].split('-');
  }

  return { title, date, time };
}

function getDate(date = '/', time = null, defaultDate) {
  const resultDate = new Date(defaultDate);
  const [month, day] = date.split('/');
  month && resultDate.setMonth(Number(month) - 1);
  day && resultDate.setDate(day);
  time && resultDate.setHours(time);
  resultDate.setMinutes(0);
  resultDate.setSeconds(0);
  return resultDate;
}

function getDateRange(date = [], time = []) {
  const defaultDate = new Date();
  const startDate = getDate(date[0], time[0], defaultDate);
  const endDate = getDate(date[1], time[1], startDate);
  return [startDate, endDate];
}

function runNPL(nl) {
  const { date, time, title } = getDateAndTitle(nl);
  const [startDate, endDate] = getDateRange(date, time);
  const alldayEvent = !time;
  return { startDate, endDate, summary: title, alldayEvent };
}

function getCalendar() {
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;
  return Application('Calendar');
}

function getProject(calendar, projectName) {
  const projectCalendars = calendar.calendars.whose({ name: projectName });
  return projectCalendars[0];
}

function run(argv) {
  const [calendarName, ...query] = argv[0].split(' ');
  const calendar = getCalendar();
  const project = getProject(calendar, calendarName);
  const eventProps = runNPL(query);
  const event = calendar.Event(eventProps);

  project.events.push(event);
  return eventProps.summary;
}

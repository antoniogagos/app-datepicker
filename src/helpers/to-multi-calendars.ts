import { getWeekdays } from 'nodemod/dist/calendar/helpers/get-weekdays.js';
import { toUTCDate } from 'nodemod/dist/calendar/helpers/to-utc-date.js';
import { calendar } from 'nodemod/dist/calendar/index.js';
import type { Calendar } from 'nodemod/dist/calendar/typings.js';

import type { MultiCalendars, ToMultiCalendarsInit } from './typings.js';

export function toMultiCalendars(
  options: ToMultiCalendarsInit
): MultiCalendars {
  const {
    dayFormat,
    fullDateFormat,
    locale,
    longWeekdayFormat,
    narrowWeekdayFormat,
    currentDate,

    disabledDates,
    disabledDays,
    firstDayOfWeek,
    max,
    min,
    showWeekNumber,
    weekLabel,
    weekNumberType,
    count,
  } = options;

  const countValue = count || 0;
  const calendarCount = countValue + +!(countValue & 1);
  const minTime = min == null ? Number.MIN_SAFE_INTEGER : +min;
  const maxTime = max == null ? Number.MAX_SAFE_INTEGER : +max;
  const weekdays = getWeekdays({
    longWeekdayFormat,
    narrowWeekdayFormat,
    firstDayOfWeek,
    showWeekNumber,
    weekLabel,
  });
  const getKey = (date: Date) => [
    locale,
    date.toJSON(),
    disabledDates?.join('_'),
    disabledDays?.join('_'),
    firstDayOfWeek,
    max?.toJSON(),
    min?.toJSON(),
    showWeekNumber,
    weekLabel,
    weekNumberType,
  ].filter(Boolean).join(':');

  const ify = currentDate.getUTCFullYear();
  const im = currentDate.getUTCMonth();
  const calendarCountInitialValue = Math.floor(calendarCount / 2) * -1;
  const calendarCountArray = Array.from(Array(calendarCount), (_, i) => calendarCountInitialValue + i);
  const calendarsList = calendarCountArray.map<Calendar>((n) => {
    const firstDayOfMonth = toUTCDate(ify, im + n, 1);
    const lastDayOfMonthTime = +toUTCDate(ify, im + n + 1, 0);
    const key = getKey(firstDayOfMonth);

    /**
     * NOTE: Return `null` when one of the followings fulfills:-
     *
     *           minTime            maxTime
     *       |--------|--------o--------|--------|
     *   last day     |   valid dates   |     first day
     *
     *  - last day of the month < `minTime` - entire month should be disabled
     *  - first day of the month > `maxTime` - entire month should be disabled
     */
    if (lastDayOfMonthTime < minTime || +firstDayOfMonth > maxTime) {
      return {
        key,

        calendar: [],
        disabledDatesSet: new Set(),
        disabledDaysSet: new Set(),
      };
    }

    const calendarDays = calendar({
      date: firstDayOfMonth,
      dayFormat,
      disabledDates,
      disabledDays,
      firstDayOfWeek,
      fullDateFormat,
      locale,
      max,
      min,
      showWeekNumber,
      weekNumberType,
    });

    return { ...calendarDays, key };
  });

  const calendars: MultiCalendars['calendars'] = [];
  const $disabledDatesSet: MultiCalendars['disabledDatesSet'] = new Set();
  const $disabledDaysSet: MultiCalendars['disabledDaysSet'] = new Set();

  for (const cal of calendarsList) {
    const {
      disabledDatesSet,
      disabledDaysSet,
      ...rest
    } = cal;

    if (rest.calendar.length > 0) {
      if (disabledDaysSet.size > 0) {
        for (const o of disabledDaysSet) $disabledDaysSet.add(o);
      }

      if (disabledDatesSet.size > 0) {
        for (const o of disabledDatesSet) $disabledDatesSet.add(o);
      }
    }

    calendars.push(rest);
  }

  return {
    calendars,
    weekdays,

    disabledDatesSet: $disabledDatesSet,
    disabledDaysSet: $disabledDaysSet,
    key: getKey(currentDate),
  };
}

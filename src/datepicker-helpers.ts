import { CalendarDays, CalendarWeekdays } from './calendar';

import { calendarDays, calendarWeekdays, WEEK_NUMBER_TYPE } from './calendar';

export const enum KEYCODES_MAP {
  ESCAPE = 27,
  SHIFT = 16,
  TAB = 9,
  ENTER = 13,
  SPACE = 32,
  PAGE_UP = 33,
  PAGE_DOWN = 34,
  END = 35,
  HOME = 36,
  ARROW_LEFT = 37,
  ARROW_UP = 38,
  ARROW_RIGHT = 39,
  ARROW_DOWN = 40,
}
export interface FocusTrap {
  disconnect: () => void;
}
type SplitStringCb = (n: string, i: number, a: string[]) => number;

// export const KEYCODES_MAP = {
//   // CTRL: 17,
//   // ALT: 18,
//   ESCAPE: 27,
//   SHIFT: 16,
//   TAB: 9,
//   ENTER: 13,
//   SPACE: 32,
//   PAGE_UP: 33,
//   PAGE_DOWN: 34,
//   END: 35,
//   HOME: 36,
//   ARROW_LEFT: 37,
//   ARROW_UP: 38,
//   ARROW_RIGHT: 39,
//   ARROW_DOWN: 40,
// };
const PREV_KEYCODES_SET = new Set([
  KEYCODES_MAP.ARROW_UP,
  KEYCODES_MAP.ARROW_LEFT,
  KEYCODES_MAP.PAGE_UP,
  KEYCODES_MAP.HOME,
]);
const NEXT_KEYCODES_SET = new Set([
  KEYCODES_MAP.ARROW_DOWN,
  KEYCODES_MAP.ARROW_RIGHT,
  KEYCODES_MAP.PAGE_DOWN,
  KEYCODES_MAP.END,
]);
const NEXT_DAY_KEYCODES_SET = new Set([
  KEYCODES_MAP.ARROW_UP,
  KEYCODES_MAP.ARROW_RIGHT,
  KEYCODES_MAP.PAGE_UP,
  KEYCODES_MAP.HOME,
]);
const PREV_DAY_KEYCODES_SET = new Set([
  KEYCODES_MAP.ARROW_DOWN,
  KEYCODES_MAP.ARROW_LEFT,
  KEYCODES_MAP.PAGE_DOWN,
  KEYCODES_MAP.END,
]);

export function getResolvedDate(date?: number | Date | string | undefined): Date {
  const dateDate = date == null ? new Date() : new Date(date);
  const isUTCDateFormat =
    typeof date === 'string' && (
      /^\d{4}[^\d\w]\d{2}[^\d\w]\d{2}$/i.test(date) ||
      /^\d{4}[^\d\w]\d{2}[^\d\w]\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(date));

  let fy = dateDate.getFullYear();
  let m = dateDate.getMonth();
  let d = dateDate.getDate();

  /**
   * NOTE: Depends on the input date string, browser will interpret the Date object differently.
   * For instance, a simple date string `2020-01-03` will default to UTC timezone. In order to get
   * the correct expected date that is `3`, `.getUTCDate` is required as `.getDate` will return a
   * date value that is based on the local timezone after the date conversion by the browser. In PST
   * timezone, that will return `2`.
   *
   * ```ts
   * // In PST (UTC-08:00) timezone, the following code will output:
   * const dateString = '2020-01-03';
   * const dateDate = new Date(dateString); // UTC time is '2020-01-03T00:00:00.000+08:00'
   *
   * dateDate.getUTCDate(); // 3
   * dateDate.getDate(); // 2
   * ```
   */
  if (isUTCDateFormat) {
    fy = dateDate.getUTCFullYear();
    m = dateDate.getUTCMonth();
    d = dateDate.getUTCDate();
  }

  /**
   * NOTE: Converts local datetime to UTC by extracting only the values locally using `get*` methods
   * instead of the `getUTC*` methods.
   *
   * FWIW, there could be still cases where `get*` methods returns something different than what is
   * expected but that is acceptable since we're relying on browser to tell us the local datetime
   * and we just use those values and treated them as if they were datetime to UTC.
   */
  return toUTCDate(fy, m, d);
}

export function getResolvedLocale() {
  return (Intl
    && Intl.DateTimeFormat
    && Intl.DateTimeFormat().resolvedOptions
    && Intl.DateTimeFormat().resolvedOptions().locale)
    || 'en-US';
}

export function computeThreeCalendarsInARow(selectedDate: Date) {
  const dateDate = new Date(selectedDate);
  const fy = dateDate.getUTCFullYear();
  const m = dateDate.getUTCMonth();
  const d = dateDate.getUTCDate();

  return [
    toUTCDate(fy, m - 1, d),
    dateDate,
    toUTCDate(fy, m + 1, d),
  ];
}

export function toFormattedDateString(date: Date) {
  if (date instanceof Date && !isNaN(+date)) {
    const dateString = date.toJSON();
    return dateString == null ? '' : dateString.replace(/^(.+)T.+/i, '$1');
  }

  return '';
}

export function dispatchCustomEvent<T = CustomEvent['defaultPrevented']>(
  target: HTMLElement,
  eventName: string,
  detail: T
) {
  return target.dispatchEvent(new CustomEvent(eventName, {
    detail,
    bubbles: true,
    composed: true,
  }));
}

export function setFocusTrap(
  target: HTMLElement,
  focusableElements: HTMLElement[]
): FocusTrap | null {
  if (target == null || focusableElements == null) return null;

  const [firstEl, lastEl] = focusableElements;
  const keydownCallback = (ev: KeyboardEvent) => {
    const isTabKey = ev.keyCode === KEYCODES_MAP.TAB;
    const isShiftTabKey = ev.shiftKey && isTabKey;

    if (!isTabKey && !isShiftTabKey) return;

    // const focusedTarget = ev.target as HTMLElement;
    const isFocusingLastEl = findShadowTarget(ev, n => n.isEqualNode(lastEl)) != null;

    if (isFocusingLastEl && !isShiftTabKey) {
      ev.preventDefault();
      ev.stopImmediatePropagation();

      // focusedTarget.blur();
      firstEl.focus();
      return;
    }

    const isFocusingFirstEl = findShadowTarget(ev, n => n.isEqualNode(firstEl)) != null;

    if (isFocusingFirstEl && isShiftTabKey) {
      ev.preventDefault();
      ev.stopImmediatePropagation();

      // focusedTarget.blur();
      /**
       * NOTE: `.focus()` native `<button>` element inside `<MwcButton>`
       */
      lastEl.shadowRoot!.querySelector('button')!.focus();
    }
  };
  const disconnectCallback = () => {
    target.removeEventListener('keydown', keydownCallback);
  };

  target.addEventListener('keydown', keydownCallback);

  return { disconnect: disconnectCallback };
}

export function targetScrollTo(target: HTMLElement, scrollToOptions: ScrollToOptions) {
  /**
   * NOTE: Due to `Element.scrollTo` and `ScrollToOptions` are not widely supported,
   * this helper can fallback to old school way of updating scrolling position.
   *
   * Links below for more browser compat:-
   *
   *   1. https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo
   *   2. https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo
   */
  if (target.scrollTo == null) {
    const { top, left } = scrollToOptions || {} as ScrollToOptions;

    target.scrollTop = top || 0;
    target.scrollLeft = left || 0;
  } else {
    target.scrollTo(scrollToOptions);
  }
}

export function hasClass(target: HTMLElement, className: string) {
  return target.classList.contains(className);
}

type AnyEventType = CustomEvent | KeyboardEvent | MouseEvent | PointerEvent;
export function findShadowTarget(
  ev: AnyEventType,
  callback: (n: HTMLElement) => boolean
) {
  return ev.composedPath().find((n) => {
    if (n instanceof HTMLElement) return callback(n);
    return false;
  });
}

export function stripLTRMark(s: string) {
  /**
   * NOTE: Due to IE11, a LTR mark (`\u200e` or `8206` in hex) will be included even when
   * `locale=en-US` is used. This helper function strips that away for consistency's sake as
   * modern browsers do not include that.
   *
   *   ```js
   *   const now = new Date('2018-01-01');
   *   const a = Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(now);
   *
   *   a.split(''); // On IE11, this returns ['', '1'].
   *   ```
   */
  if (typeof s !== 'string' || !s.length) return s;

  const splitted = s.split('');

  return splitted.length > 1 ? s.replace(/\u200e/gi, '') : s;
}

export function arrayFilled(size: number) {
  const filled: number[] = [];
  for (let i = 0; i < size; i += 1) {
    filled.push(i);
  }
  return filled;
}

export function isValidDate(date: string, dateDate: Date) {
  return !(date == null || !(dateDate instanceof Date) || isNaN(+dateDate));
}

export function toUTCDate(fullYear: number, month: number, day: number) {
  return new Date(Date.UTC(fullYear, month, day));
}

export function splitString(dateString: string): string[];
export function splitString(
  dateString: string,
  cb: SplitStringCb): number[];
export function splitString(
  dateString: string,
  cb?: SplitStringCb
): any[] {
  const dateList = typeof dateString === 'string' && dateString.length > 0
    ? dateString.split(/,\s*/i)
    : [];

  if (!dateList.length) return [] as any;

  return typeof cb === 'function' ? dateList.map(cb) : dateList;
}

// function getNextSelectableDate({
//   disabledDatesSet,
//   focusedDate,
//   keyCode,
// }) {
//   let isDisabledDay = disabledDatesSet.has(+focusedDate);

//   if (!isDisabledDay) return focusedDate;

//   const fy = focusedDate.getUTCFullYear();
//   const m = focusedDate.getUTCMonth();

//   let d = focusedDate.getUTCDate();
//   let newFocusedDate = focusedDate;

//   while (isDisabledDay) {
//     switch (keyCode) {
//       case KEYCODES_MAP.HOME:
//       case KEYCODES_MAP.PAGE_UP:
//       case KEYCODES_MAP.ARROW_DOWN:
//       case KEYCODES_MAP.ARROW_LEFT: {
//         d -= 1;
//         break;
//       }
//       // case KEYCODES_MAP.END:
//       // case KEYCODES_MAP.PAGE_DOWN:
//       // case KEYCODES_MAP.ARROW_UP:
//       // case KEYCODES_MAP.ARROW_RIGHT:
//       default:
//         d += 1;
//     }

//     newFocusedDate = new Date(Date.UTC(fy, m, d));
//     isDisabledDay = disabledDatesSet.has(+newFocusedDate);
//   }

//   return newFocusedDate;
// }
// function computeNewFocusedDateWithKeyboard({
//   min,
//   max,
//   selectedDate,
//   fy,
//   m,
//   d,
//   isMonthYearUpdate,
//   disabledDatesSet,
// }) {
//   let newFocusedDate = new Date(Date.UTC(fy, m, d));
//   let dayInNewFocusedDate = newFocusedDate.getUTCDate();

//   /**
//    * NOTE: Check if new focused date exists in that new month. e.g. Feb 30. This should fallback
//    * to last day of the month (Feb), that is, Feb 28. Then if Feb 28 happens to fall in the
//    * disabled date range, the next step can take care of that.
//    */
//   if (isMonthYearUpdate && d !== dayInNewFocusedDate) {
//     const newAdjustedDate = new Date(Date.UTC(fy, m + 1, 0));

//     dayInNewFocusedDate = newAdjustedDate.getUTCDate();
//     newFocusedDate = newAdjustedDate;
//   }

//   /**
//    * NOTE: Clipping new focused date to `min` or `max` when it falls into the range of disabled
//    * dates.
//    */
//   const isLessThanMin = +newFocusedDate < min;
//   const isMoreThanMax = +newFocusedDate > max;
//   if (isLessThanMin || isMoreThanMax) {
//     /** Set to `min` date */
//     if (isLessThanMin) {
//       return {
//         shouldUpdateDate: false,
//         date: getNextSelectableDate({
//           disabledDatesSet,
//           focusedDate: new Date(min),
//           keyCode: KEYCODES_MAP.ARROW_RIGHT,
//         }),
//       };
//     }

//     /** Set to `max` date */
//     if (isMoreThanMax) {
//       return {
//         shouldUpdateDate: false,
//         date: getNextSelectableDate({
//           disabledDatesSet,
//           focusedDate: new Date(max),
//           keyCode: KEYCODES_MAP.ARROW_LEFT,
//         }),
//       }
//     };

//     /** FIXME: Then when this happen? */
//     return { isMinMax: false, shouldUpdateDate: false, date: null };
//   }

//   const shouldUpdateDate =
//     newFocusedDate.getUTCMonth() !== selectedDate.getUTCMonth() ||
//     newFocusedDate.getUTCFullYear() !== selectedDate.getUTCFullYear();

//   return { shouldUpdateDate, date: newFocusedDate };
// }
// export function computeNextFocusedDate({
//   focusedDate,
//   selectedDate,
//   min,
//   max,
//   disabledDatesSet,

//   keyCode,
//   hasAltKey,
// }) {
//   const oldFy = focusedDate.getUTCFullYear();
//   const oldM = focusedDate.getUTCMonth();
//   const oldD = focusedDate.getUTCDate();

//   /**
//    * NOTE: Focus to the 1st day of the current month when:-
//    *
//    *  - `_selectedDate` has a different value of _full year_ than that of `_focusedDate`.
//    *  - `_selectedDate` has a different value of _month_ than that of `_focusedDate`.
//    *
//    * This could simply mean that user changes `_selectedDate` with a new value of `month` or
//    * `year` but `_focusedDate` remains unchanged and it could be an out-of-bound calendar date.
//    * When keyboard event is detected, the 1st day of the current visible/ focusing month should
//    * be focused by updating `_focusedDate` with that value.
//    */
//   const sdM = selectedDate.getUTCMonth();
//   const sdFy = selectedDate.getUTCFullYear();

//   if (sdM !== oldM || sdFy !== oldFy) {
//     return {
//       shouldUpdateDate: true,
//       date: getNextSelectableDate({
//         disabledDatesSet,
//         keyCode,
//         focusedDate: new Date(Date.UTC(sdFy, sdM, 1)),
//       }),
//     }
//   }

//   let isMonthYearUpdate = false;
//   let fy = oldFy;
//   let m = oldM;
//   let d = oldD;

//   switch (keyCode) {
//     case KEYCODES_MAP.ARROW_UP: {
//       d -= 7;
//       break;
//     }
//     case KEYCODES_MAP.ARROW_RIGHT: {
//       d += 1;
//       break;
//     }
//     case KEYCODES_MAP.ARROW_DOWN: {
//       d += 7;
//       break;
//     }
//     case KEYCODES_MAP.ARROW_LEFT: {
//       d -= 1;
//       break;
//     }
//     case KEYCODES_MAP.HOME: {
//       d = 1;
//       break;
//     }
//     case KEYCODES_MAP.END: {
//       m += 1;
//       d = 0;
//       break;
//     }
//     case KEYCODES_MAP.ENTER: {
//       if (+selectedDate !== +focusedDate) {
//         this._selectedDate = focusedDate;
//       }

//       return this.updateComplete;
//     }
//     case KEYCODES_MAP.PAGE_UP: {
//       isMonthYearUpdate = true;
//       hasAltKey ? fy -= 1 : m -= 1;
//       break;
//     }
//     case KEYCODES_MAP.PAGE_DOWN: {
//       isMonthYearUpdate = true;
//       hasAltKey ? fy += 1 : m += 1;
//       break;
//     }
//   }

//   /** NOTE: Skip calendar update if new focused date remains unchanged. */
//   if (fy === oldFy && m === oldM && d === oldD) {
//     return {
//       shouldUpdateDate: false,
//       date: focusedDate,
//     };
//   }

//   const { shouldUpdateDate, date } = computeNewFocusedDateWithKeyboard({
//     min,
//     max,
//     selectedDate,
//     fy,
//     m,
//     d,
//     isMonthYearUpdate,
//     disabledDatesSet,
//   });

//   /**
//    * NOTE: If `date` returns null or `date` still same as `focusedDate`,
//    * this can skip updating any dates. This could simply mean the new focused date is
//    * within the range of * `min` and `max` dates.
//    */
//   return {
//     shouldUpdateDate,
//     date:
//       (date == null || +date === +focusedDate)
//         ? focusedDate
//         : getNextSelectableDate({
//           disabledDatesSet,
//           focusedDate: date,
//           keyCode,
//         }),
//   }
// }

export type DateTimeFormatter = (date?: number | Date | undefined) => string;
export interface Formatters {
  dayFormatter: DateTimeFormatter;
  fullDateFormatter: DateTimeFormatter;
  longWeekdayFormatter: DateTimeFormatter;
  narrowWeekdayFormatter: DateTimeFormatter;
  longMonthYearFormatter: DateTimeFormatter;
  dateFormatter: DateTimeFormatter;
  yearFormatter: DateTimeFormatter;

  locale: string;
}
export function updateFormatters(locale: string): Formatters {
  const dayFormatter = Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' }).format;
  const fullDateFormatter = Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format;
  const longWeekdayFormatter = Intl.DateTimeFormat(locale, {
    weekday: 'long',
    timeZone: 'UTC',
  }).format;
  const narrowWeekdayFormatter = Intl.DateTimeFormat(locale, {
    weekday: 'narrow',
    timeZone: 'UTC',
  }).format;
  const longMonthYearFormatter = Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format;
  const dateFormatter = Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format;
  const yearFormatter = Intl.DateTimeFormat(locale, {
    year: 'numeric',
    timeZone: 'UTC',
  }).format;

  return {
    dayFormatter,
    fullDateFormatter,
    longMonthYearFormatter,
    longWeekdayFormatter,
    narrowWeekdayFormatter,
    dateFormatter,
    yearFormatter,

    locale,
  };
}

interface ParamsComputeAllCalendars {
  disabledDays: string;
  disabledDates: string;
  firstDayOfWeek: number;
  max: Date;
  min: Date;
  selectedDate: Date;
  showWeekNumber: boolean;
  weekNumberType: WEEK_NUMBER_TYPE;

  longWeekdayFormatterFn: DateTimeFormatter;
  narrowWeekdayFormatterFn: DateTimeFormatter;
  dayFormatterFn: DateTimeFormatter;
  fullDateFormatterFn: DateTimeFormatter;
}
export interface AllCalendars {
  weekdays: CalendarWeekdays[];
  calendars: (CalendarDays['calendar'] | null)[];
  disabledDatesSet: Set<number>;
}
export function computeAllCalendars({
  disabledDays,
  disabledDates,
  firstDayOfWeek,
  max,
  min,
  selectedDate,
  showWeekNumber,
  weekNumberType,

  longWeekdayFormatterFn,
  narrowWeekdayFormatterFn,
  dayFormatterFn,
  fullDateFormatterFn,
}: ParamsComputeAllCalendars): AllCalendars {
  let clt = window.performance.now();
  const minTime = +min;
  const maxTime = +max;
  const weekdays = calendarWeekdays({
    firstDayOfWeek,
    showWeekNumber,

    longWeekdayFormatter: longWeekdayFormatterFn,
    narrowWeekdayFormatter: narrowWeekdayFormatterFn,
  });
  const allCalendars = computeThreeCalendarsInARow(selectedDate).map((n, idx) => {
    const nFy = n.getUTCFullYear();
    const nM = n.getUTCMonth();
    const firstDayOfMonthTime = +toUTCDate(nFy, nM, 1);
    const lastDayOfMonthTime = +toUTCDate(nFy, nM + 1, 0);

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
    if (lastDayOfMonthTime < minTime || firstDayOfMonthTime > maxTime) {
      return null;
    }

    return calendarDays({
      firstDayOfWeek,
      showWeekNumber,
      weekNumberType,
      max,
      min,
      selectedDate: n,
      disabledDatesList: splitString(disabledDates, o => +getResolvedDate(o)),
      disabledDaysList: splitString(disabledDays, o => (showWeekNumber ? 1 : 0) + +(o)),
      idOffset: idx * 10,

      dayFormatter: dayFormatterFn,
      fullDateFormatter: fullDateFormatterFn,
    });
  });
  clt = window.performance.now() - clt;
  const cltEl = document.body.querySelector('.calendar-render-time');
  if (cltEl) {
    cltEl.textContent = `Rendering calendar takes ${clt < 1 ? '< 1' : clt.toFixed(2)} ms`;
  }

  return {
    weekdays,
    calendars: allCalendars.map(n => n && n.calendar),
      // allCalendars.reduce((p, n) => p.concat((n && [n.calendar])), [] as (CalendarDays)[]),
    disabledDatesSet:
      new Set(
        allCalendars.reduce((p, n) => n == null ? p : p.concat(n!.disabledDates), [] as number[])),
  };
}

interface ParamsGetNextSelectableDate {
  keyCode: KeyboardEvent['keyCode'];
  disabledDaysSet: Set<number>;
  disabledDatesSet: Set<number>;
  focusedDate: Date;
  maxTime: number;
  minTime: number;
}
function getNextSelectableDate({
  keyCode,
  disabledDaysSet,
  disabledDatesSet,
  focusedDate,
  maxTime,
  minTime,
}: ParamsGetNextSelectableDate) {
  const focusedDateTime = +focusedDate;
  let isLessThanMinTime = focusedDateTime < minTime;
  let isMoreThanMaxTime = focusedDateTime > maxTime;

  let isDisabledDay =
    isLessThanMinTime ||
    isMoreThanMaxTime ||
    disabledDaysSet.has((focusedDate as Date).getUTCDay()) ||
    disabledDatesSet.has(focusedDateTime);

  if (!isDisabledDay) return focusedDate;

  let selectableFocusedDateTime = 0;
  let selectableFocusedDate =
    isLessThanMinTime
      ? new Date(isMoreThanMaxTime ? maxTime : minTime)
      : focusedDate;

  const fy = selectableFocusedDate.getUTCFullYear();
  const m = selectableFocusedDate.getUTCMonth();
  let d = selectableFocusedDate.getUTCDate();

  while (isDisabledDay) {
    if (isLessThanMinTime || (!isMoreThanMaxTime && NEXT_DAY_KEYCODES_SET.has(keyCode))) d += 1;
    if (isMoreThanMaxTime || (!isLessThanMinTime && PREV_DAY_KEYCODES_SET.has(keyCode))) d -= 1;

    selectableFocusedDate = toUTCDate(fy, m, d);
    selectableFocusedDateTime = +selectableFocusedDate;

    if (!isLessThanMinTime) {
      isLessThanMinTime = selectableFocusedDateTime < minTime;

      if (isLessThanMinTime) {
        selectableFocusedDate = new Date(minTime);
        selectableFocusedDateTime = +selectableFocusedDate;
        d = selectableFocusedDate.getUTCDate();
      }
    }

    if (!isMoreThanMaxTime) {
      isMoreThanMaxTime = selectableFocusedDateTime > maxTime;

      if (isMoreThanMaxTime) {
        selectableFocusedDate = new Date(maxTime);
        selectableFocusedDateTime = +selectableFocusedDate;
        d = selectableFocusedDate.getUTCDate();
      }
    }

    isDisabledDay =
      disabledDaysSet.has(selectableFocusedDate.getUTCDay()) ||
      disabledDatesSet.has(selectableFocusedDateTime);
  }

  return selectableFocusedDate;
}

interface ParamsComputeNextFocusedDate {
  hasAltKey: boolean;
  keyCode: KeyboardEvent['keyCode'];
  focusedDate: Date;
  selectedDate: Date;
  disabledDaysSet: Set<number>;
  disabledDatesSet: Set<number>;
  minTime: number;
  maxTime: number;
}
export function computeNextFocusedDate({
  hasAltKey,
  keyCode,
  focusedDate,
  selectedDate,
  disabledDaysSet,
  disabledDatesSet,
  minTime,
  maxTime,
}: ParamsComputeNextFocusedDate) {
  /**
   * To update focused date,
   *
   *   1. Checks if focused date is not in the same month, skip update by focusing 1st selectable
   *      day of the new focused month. Continue at `Step 4.`.
   *   2. Checks if current focused date is either `min` or `max` then bails out immediately.
   *   3. Compute new focused date based on key pressed.
   *        a. `UP` - `d -= 7`
   *        b. `DOWN` - `d += 7`
   *        c. `LEFT` - `d -= 1`
   *        d. `RIGHT` - `d += 1`
   *        e. `PAGE_DOWN` - `m += 1`
   *        f. `PAGE_UP` - `m -= 1`
   *        g. `Alt` + `PAGE_DOWN` - `fy += 1`
   *        h. `Alt` + `PAGE_UP` - `fy -= 1`
   *        i. `END` - `m += 1; d = 0`
   *        j. `HOME` - `d = 1`
   *   4. Compute selectable date based on new focused date with `while` loop for any disabled date:
   *        a. UP, RIGHT, PAGE_UP, Alt + PAGE_UP - `d += 1`
   *        b. DOWN, LEFT, PAGE_DOWN, Alt + PAGE_DOWN - `d -= 1`
   *        c. If new focused date is either `min` or `max`, reverse order `d += 1` -> `d -= 1` and
   *         continue the loop until new selectable focused date.
   */

  const oldFy = focusedDate.getUTCFullYear();
  const oldM = focusedDate.getUTCMonth();
  const oldD = focusedDate.getUTCDate();
  const focusedDateTime = +focusedDate;

  const sdFy = selectedDate.getUTCFullYear();
  const sdM = selectedDate.getUTCMonth();

  let fy = oldFy;
  let m = oldM;
  let d = oldD;

  switch (true) {
    case sdM !== oldM || sdFy !== oldFy: {
      fy = sdFy;
      m = sdM;
      d = 1;
      break;
    }
    case focusedDateTime === minTime && PREV_KEYCODES_SET.has(keyCode):
    case focusedDateTime === maxTime && NEXT_KEYCODES_SET.has(keyCode):
      break;
    case keyCode === KEYCODES_MAP.ARROW_UP: {
      d -= 7;
      break;
    }
    case keyCode === KEYCODES_MAP.ARROW_DOWN: {
      d += 7;
      break;
    }
    case keyCode === KEYCODES_MAP.ARROW_LEFT: {
      d -= 1;
      break;
    }
    case keyCode === KEYCODES_MAP.ARROW_RIGHT: {
      d += 1;
      break;
    }
    case keyCode === KEYCODES_MAP.PAGE_DOWN: {
      hasAltKey ? fy += 1 : m += 1;
      break;
    }
    case keyCode === KEYCODES_MAP.PAGE_UP: {
      hasAltKey ? fy -= 1 : m -= 1;
      break;
    }
    case keyCode === KEYCODES_MAP.END: {
      m += 1;
      d = 0;
      break;
    }
    case keyCode === KEYCODES_MAP.HOME:
    default: {
      d = 1;
      break;
    }
  }

  /** Get next selectable focused date */
  const newFocusedDate = getNextSelectableDate({
    keyCode,
    maxTime,
    minTime,
    disabledDaysSet,
    disabledDatesSet,
    focusedDate: toUTCDate(fy, m, d),
  });

  return newFocusedDate;
}
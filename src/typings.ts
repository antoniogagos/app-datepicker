import type { LitElement, PropertyValues } from 'lit';
import type { DateTimeFormatter } from 'nodemod/dist/calendar/typings.js';

import type { startViews } from './constants.js';
import type { DatePicker } from './date-picker/date-picker.js';
import type { keyArrowDown, keyArrowLeft, keyArrowRight, keyArrowUp, keyEnd, keyEnter, keyHome, keyPageDown, keyPageUp, keySpace, keyTab } from './key-values.js';
import type { DatePickerMinMaxProperties, DatePickerMixinProperties, ElementMixinProperties } from './mixins/typings.js';
import type { Constructor } from './utility-typings.js';

export type ChangedProperties<T = Record<string, unknown>> = PropertyValues & Map<keyof T, T[keyof T]>;

export interface CustomEventAction<T extends string, CustomEventDetail> {
  detail: CustomEventDetail;
  type: T;
}

export interface CustomEventDetail {
  ['date-updated']: CustomEventAction<'date-updated', CustomEventDetailDateUpdated>;
  ['first-updated']: CustomEventAction<'first-updated', CustomEventDetailFirstUpdated>;
  ['year-updated']: CustomEventAction<'year-updated', CustomEventDetailYearUpdated>;
}

interface CustomEventDetailDateUpdated extends KeyEvent, DatePickerValues {}

interface CustomEventDetailFirstUpdated extends DatePickerValues {
  focusableElements: HTMLElement[];
}

/**
 * NOTE: No `KeyEvent` is needed as native `button` element will dispatch `click` event on keypress.
 */
interface CustomEventDetailYearUpdated {
  year: number;
}

export interface DatePickerProperties extends
  DatePickerMinMaxProperties,
  DatePickerMixinProperties,
  ElementMixinProperties {}

type DatePickerValues = Required<Pick<DatePicker, 'value' | 'valueAsDate' | 'valueAsNumber'>>;

export interface Formatters extends Pick<DatePicker, 'locale'> {
  dayFormat: DateTimeFormatter;
  fullDateFormat: DateTimeFormatter;
  longWeekdayFormat: DateTimeFormatter;
  narrowWeekdayFormat: DateTimeFormatter;
  longMonthFormat: DateTimeFormatter;
  longMonthYearFormat: DateTimeFormatter;
  dateFormat: DateTimeFormatter;
  yearFormat: DateTimeFormatter;
}

export type InferredFromSet<SetType> = SetType extends Set<infer T> ? T : never;

interface KeyEvent {
  isKeypress: boolean;
  key?: SupportedKey;
}

export type LitConstructor = Constructor<LitElement>;

export type StartView = StartViewTuple[number];

export type StartViewTuple = typeof startViews;

export type SupportedKey =
  | typeof keyArrowDown
  | typeof keyArrowLeft
  | typeof keyArrowRight
  | typeof keyArrowUp
  | typeof keyEnd
  | typeof keyEnter
  | typeof keyHome
  | typeof keyPageDown
  | typeof keyPageUp
  | typeof keySpace
  | typeof keyTab;

export interface ValueUpdatedEvent extends KeyEvent {
  value: string;
}

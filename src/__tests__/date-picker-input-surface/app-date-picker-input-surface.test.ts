import '../../date-picker-input-surface/app-date-picker-input-surface';

import { expect, fixture, html } from '@open-wc/testing';

import type { DialogClosedEventDetail } from '../../date-picker-dialog/typings';
import type { AppDatePickerInputSurface } from '../../date-picker-input-surface/app-date-picker-input-surface';
import { appDatePickerInputSurfaceName } from '../../date-picker-input-surface/constants';
import { promiseTimeout } from '../constants';
import { eventOnce } from '../test-utils/event-once';

describe(appDatePickerInputSurfaceName, () => {
  const elementSelectors = {
    mdcMenuSurface: '.mdc-menu-surface',
  } as const;

  it('renders', async () => {
    const el = await new Promise<AppDatePickerInputSurface>(async (resolve) => {
      const element = await fixture<AppDatePickerInputSurface>(
        html`<app-date-picker-input-surface .open=${true} @opened=${() => resolve(element)}>
          <h1 class=test>Test</h1>
        </app-date-picker-input-surface>`
      );

      globalThis.setTimeout(() => resolve(element), promiseTimeout);
    });

    const mdcMenuSurface = el.query(elementSelectors.mdcMenuSurface);

    expect(mdcMenuSurface).exist;
  });

  it('closes when clicking outside of surface', async () => {
    const el = await new Promise<AppDatePickerInputSurface>(async (resolve) => {
      const element = await fixture<AppDatePickerInputSurface>(
        html`<app-date-picker-input-surface .open=${true} @opened=${() => resolve(element)}>
          <h1 class=test>Test</h1>
        </app-date-picker-input-surface>`
      );

      globalThis.setTimeout(() => resolve(element), promiseTimeout);
    });

    const mdcMenuSurface = el.query(elementSelectors.mdcMenuSurface);

    expect(mdcMenuSurface).exist;

    const closedTask = eventOnce<
      typeof el,
      'closed',
      CustomEvent<DialogClosedEventDetail>
    >(el, 'closed');

    document.body.click();

    const closed = await closedTask;

    expect(closed?.detail).not.undefined;
    expect(el.open).false;
    expect(mdcMenuSurface).exist;
  });
});

import { describe, expect, it } from 'vitest';
import { addMonths, format, subMonths } from 'date-fns';
import { flushPromises } from '@vue/test-utils';
import { getMonthToggleBtn, getMonthToggleText, openMenu, selectDate } from '@/__tests__/tests-utils.ts';

describe('Test Suite 1', () => {
    describe('multi-calendars', () => {
        it('Should render 2 calendars', async () => {
            const dp = await openMenu({ multiCalendars: true });
            const today = new Date();

            const monthToggleFirst = getMonthToggleBtn(dp);
            const monthToggleSecond = getMonthToggleBtn(dp, 1);
            expect(monthToggleFirst.text()).toEqual(getMonthToggleText(today));
            expect(monthToggleSecond.text()).toEqual(getMonthToggleText(addMonths(today, 1)));
        });

        it('Should update both calendars when month is changed', async () => {
            const dp = await openMenu({ multiCalendars: true });
            const today = new Date();

            await dp.find(`[data-dp-element="action-next"]`).trigger('click');

            expect(getMonthToggleBtn(dp).text()).toEqual(getMonthToggleText(addMonths(today, 1)));
            expect(getMonthToggleBtn(dp, 1).text()).toEqual(getMonthToggleText(addMonths(today, 2)));
        });

        it('Should set proper months and years when model-value is provided', async () => {
            const date = subMonths(new Date(), 3);
            const dp = await openMenu({
                multiCalendars: true,
                modelValue: date,
            });

            expect(getMonthToggleBtn(dp).text()).toEqual(getMonthToggleText(date));
        });

        it("Should render 5 calendars when 'count' property is provided", async () => {
            const dp = await openMenu({ multiCalendars: { count: 5 } });
            expect(getMonthToggleBtn(dp, 4).text()).toEqual(getMonthToggleText(addMonths(new Date(), 4)));
        });

        it('Should render calendars in solo mode', async () => {
            const dp = await openMenu({ multiCalendars: { solo: true } });
            const navs = dp.findAll(`[data-dp-element="action-next"]`);
            expect(navs).toHaveLength(2);
        });

        it('Should update solo calendars independently', async () => {
            const dp = await openMenu({ multiCalendars: { solo: true } });
            await dp.find(`[data-dp-element="action-next"]`).trigger('click');

            expect(getMonthToggleBtn(dp).text()).toEqual(getMonthToggleText(addMonths(new Date(), 1)));
            expect(getMonthToggleBtn(dp, 1).text()).toEqual(getMonthToggleText(addMonths(new Date(), 1)));
        });

        it('Should move the selection to the first calendar when static is disabled', async () => {
            const nextMonth = addMonths(new Date(), 1);
            const dp = await openMenu({ multiCalendars: { static: false } });
            await selectDate(dp, nextMonth);
            expect(getMonthToggleBtn(dp).text()).toEqual(getMonthToggleText(nextMonth));
        });
    });

    describe('centered option', () => {
        it('Should open menu when centered is enabled', async () => {
            const dp = await openMenu({ centered: true });
            expect(dp.find('.dp__menu').exists()).toBe(true);
        });
    });

    describe('preset dates in range mode', () => {
        it('Should clamp preset range to minDate and maxDate intersection', async () => {
            const minDate = new Date(2026, 0, 10);
            const maxDate = new Date(2026, 0, 20);

            const dp = await openMenu({
                range: true,
                minDate,
                maxDate,
                presetDates: [
                    {
                        label: 'Out of bounds',
                        testId: 'preset-range-clamped',
                        value: [new Date(2026, 0, 5), new Date(2026, 0, 25)],
                    },
                ],
            });

            await dp.find('[data-test-id="preset-range-clamped"]').trigger('click');
            await flushPromises();

            const modelChanges = dp.emitted('internal-model-change') ?? [];
            const latestValue = modelChanges.at(-1)?.[0] as Date[] | undefined;

            expect(Array.isArray(latestValue)).toBe(true);
            expect(latestValue).toHaveLength(2);
            expect(format(latestValue![0]!, 'yyyy-MM-dd')).toBe('2026-01-10');
            expect(format(latestValue![1]!, 'yyyy-MM-dd')).toBe('2026-01-20');
        });

        it('Should not apply preset range when there is no intersection with min/max limits', async () => {
            const dp = await openMenu({
                range: true,
                minDate: new Date(2026, 0, 10),
                maxDate: new Date(2026, 0, 20),
                modelValue: [new Date(2026, 0, 12), new Date(2026, 0, 14)],
                presetDates: [
                    {
                        label: 'No overlap',
                        testId: 'preset-range-no-overlap',
                        value: [new Date(2026, 0, 1), new Date(2026, 0, 5)],
                    },
                ],
            });

            const modelChangesBefore = (dp.emitted('internal-model-change') ?? []).length;
            await dp.find('[data-test-id="preset-range-no-overlap"]').trigger('click');
            await flushPromises();
            const modelChangesAfter = (dp.emitted('internal-model-change') ?? []).length;

            expect(modelChangesAfter).toBe(modelChangesBefore);
        });
    });
});

/* Fixed, synthetic scenario shared by all five proposals and the actual-app baseline capture. */
window.KMT_FIXTURE = (() => {
  const now = '2026-10-15T06:00:00.000Z';
  const dateAt = n => new Date(Date.UTC(2026, 9, 18 + n, 12)).toISOString().slice(0, 10);
  const weekday = date => new Date(date + 'T12:00:00Z').getUTCDay();
  function instant(date, hour) {
    let utc = Date.parse(`${date}T${String(hour).padStart(2, '0')}:00:00Z`);
    const format = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    for (let i = 0; i < 2; i++) {
      const values = Object.fromEntries(format.formatToParts(new Date(utc)).map(part => [part.type, part.value]));
      const local = Date.parse(`${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}Z`);
      utc += Date.parse(`${date}T${String(hour).padStart(2, '0')}:00:00Z`) - local;
    }
    return new Date(utc).toISOString();
  }
  const weeklyHours = Array.from({ length: 7 }, (_, day) => ({ weekday: day, enabled: day !== 5, hours: day === 5 ? null : { start: '10:00', end: '15:00' } }));
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = dateAt(i), status = weekday(date) === 5 ? 'CLOSED_WEEKLY' : date === '2026-10-20' ? 'FULL' : 'AVAILABLE';
    return { date, status, hours: weekday(date) === 5 ? null : { start: '10:00', end: '15:00' }, closedPeriods: date === '2026-10-21' ? [{ start: '10:00', end: '12:00' }] : [] };
  });
  const slotsByDate = Object.fromEntries(days.map(day => [day.date, day.status === 'AVAILABLE' ?
    Array.from({ length: day.date === '2026-10-21' ? 3 : 5 }, (_, i) => {
      const hour = (day.date === '2026-10-21' ? 12 : 10) + i;
      return { id: `${day.date}-${hour}`, startsAt: instant(day.date, hour), endsAt: instant(day.date, hour + 1), mode: 'PHONE' };
    }) : []]));
  function availability(date, empty = false) {
    const target = date || days[0].date;
    const all = empty ? [] : days.flatMap(day => slotsByDate[day.date]);
    const suggestedSlots = all.filter(slot => slot.startsAt >= instant(target, 0)).slice(0, 3);
    const selectedDay = days.find(day => day.date === target) || days[0];
    return { published: !empty, timezone: 'Africa/Cairo', now, slotDurationMinutes: 60, weeklyHours: empty ? [] : weeklyHours,
      days: empty ? days.map(day => ({ ...day, status: 'UNPUBLISHED', hours: null, closedPeriods: [] })) : days,
      selectedDay: empty ? { ...selectedDay, status: 'UNPUBLISHED', hours: null, closedPeriods: [] } : selectedDay,
      window: { startsOn: days[0].date, endsOn: days.at(-1).date }, slots: empty ? [] : date ? slotsByDate[target] || [] : all.slice(0, 3),
      nearestSlot: suggestedSlots[0] || null, suggestedSlots, hasAvailability: all.length > 0 };
  }
  return { now, days, weeklyHours, slotsByDate, availability, firstDate: days[0].date, closedDate: '2026-10-23', fullDate: '2026-10-20', partialDate: '2026-10-21' };
})();

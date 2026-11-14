import JalaliX from '@jalalix/typescript'

// Types
import type { AdapterFormats, AdapterOptions, DateBuilderReturnType, FieldFormatTokenMap, MuiPickersAdapter, PickerValidDate, PickersTimezone } from '@mui/x-date-pickers/models'

const MONTH_NAMES = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
const WEEKDAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه شنبه', 'چهار شنبه', 'پنج شنبه', 'جمعه']
const WEEKDAY_LETTERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const formatTokenMap: FieldFormatTokenMap = {
	// Year
	YY: 'year',
	YYYY: { sectionType: 'year', contentType: 'digit', maxLength: 4 },

	// Month
	M: { sectionType: 'month', contentType: 'digit', maxLength: 2 },
	MM: 'month',
	MMM: { sectionType: 'month', contentType: 'letter' },
	MMMM: { sectionType: 'month', contentType: 'letter' },

	// Day of the month
	D: { sectionType: 'day', contentType: 'digit', maxLength: 2 },
	DD: 'day',

	// Day of the week (JalaliX tokens)
	WN: { sectionType: 'weekDay', contentType: 'letter' },
	wn: { sectionType: 'weekDay', contentType: 'letter' },
	WL: { sectionType: 'weekDay', contentType: 'letter' },
	wl: { sectionType: 'weekDay', contentType: 'letter' },
	dddd: { sectionType: 'weekDay', contentType: 'letter' },
	ddd: { sectionType: 'weekDay', contentType: 'letter' },
	dd: { sectionType: 'weekDay', contentType: 'letter' },
	d: { sectionType: 'weekDay', contentType: 'digit', maxLength: 2 },

	// Meridiem
	A: 'meridiem',
	a: 'meridiem',

	// Hours
	H: { sectionType: 'hours', contentType: 'digit', maxLength: 2 },
	HH: 'hours',
	h: { sectionType: 'hours', contentType: 'digit', maxLength: 2 },
	hh: 'hours',

	// Minutes
	m: { sectionType: 'minutes', contentType: 'digit', maxLength: 2 },
	mm: 'minutes',

	// Seconds
	s: { sectionType: 'seconds', contentType: 'digit', maxLength: 2 },
	ss: 'seconds'
}

const defaultFormats: AdapterFormats = {
	year: 'YYYY',
	month: 'MMM',
	monthShort: 'MMM',
	dayOfMonth: 'D',
	dayOfMonthFull: 'D',
	weekday: 'WN',
	weekdayShort: 'WL',
	hours24h: 'HH',
	hours12h: 'hh',
	meridiem: 'A',
	minutes: 'mm',
	seconds: 'ss',

	fullDate: 'WN D MMM YYYY',
	keyboardDate: 'YYYY/MM/DD',
	shortDate: 'D MMM',
	normalDate: 'D MMM',
	normalDateWithWeekday: 'WN، D MMM',

	fullTime12h: 'hh:mm A',
	fullTime24h: 'HH:mm',

	keyboardDateTime12h: 'YYYY/MM/DD hh:mm A',
	keyboardDateTime24h: 'YYYY/MM/DD HH:mm'
}

declare module '@mui/x-date-pickers/models' {
	interface PickerValidDateLookup {
		jalalix: JalaliX
	}
}

/**
 * MUI X Date Pickers adapter backed by `@jalalix/typescript`.
 *
 * Implements {@link MuiPickersAdapter} with Jalali (Persian / Shamsi) calendar
 * semantics: months are Jalali, the week starts on Saturday, and format tokens
 * follow JalaliX (`YYYY`, `MMM`, `WN`, etc.).
 *
 * Pass to `LocalizationProvider`:
 * ```ts
 * <LocalizationProvider dateAdapter={AdapterJalaliX}>
 * ```
 *
 * @example
 * ```ts
 * const adapter = new AdapterJalaliX({ locale: 'fa', formats: { keyboardDate: 'YYYY/MM/DD' } })
 * const today = adapter.date()
 * adapter.format(today, 'fullDate')
 * ```
 */
export class AdapterJalaliX implements MuiPickersAdapter {
	// Always `true` — marks this as an MUI X date adapter.
	public isMUIAdapter = true

	// Adapter supports MUI timezone APIs (`date`, `setTimezone`, etc.).
	public isTimezoneCompatible = true

	// Library id registered with MUI (`jalalix`).
	public lib = 'jalalix'

	// Optional locale code (defaults to `'fa'` via {@link getCurrentLocaleCode}).
	public locale?: string

	// Merged adapter format map (defaults + constructor overrides).
	public formats: AdapterFormats

	// Characters that escape literal text inside format strings (`[` … `]`).
	public escapedCharacters = { start: '[', end: ']' }

	// Token -> section mapping used by MUI field components.
	public formatTokenMap = formatTokenMap

	/**
	 * Creates a JalaliX-backed MUI pickers adapter.
	 * @param options - Adapter options.
	 * @param options.locale - Locale code (e.g. `'fa'`, `'en'`); affects 12-hour cycle detection.
	 * @param options.formats - Partial overrides for {@link AdapterFormats} keys (e.g. `keyboardDate`).
	 */
	constructor({ locale, formats }: AdapterOptions<string, never> = {}) {
		if (locale !== undefined) this.locale = locale
		this.formats = { ...defaultFormats, ...formats }
	}

	private asJalaliX = (value: PickerValidDate): JalaliX => {
		if (value instanceof JalaliX) return value
		return JalaliX.create(value as Date | string | number)
	}

	/** Applies IANA / alias timezone via JalaliX (instant-preserving). */
	private withTimezone = (value: JalaliX, timezone: PickersTimezone = 'default'): JalaliX => {
		return value.setTimezone(timezone)
	}

	/**
	 * Sets Jalali Y/M/D and wall clock in the value's active timezone.
	 * Month is 0-based (Farvardin = 0), matching MUI / `Date`.
	 */
	private setJalaliParts = (value: PickerValidDate, year: number, month: number, date: number, hours = 12, minutes = 0, seconds = 0, ms = 0): JalaliX => {
		const result = this.asJalaliX(value).clone()
		result.setFullYear(year, month, date)
		result.setHours(hours, minutes, seconds, ms)
		return result
	}

	/** Sets wall clock fields in the active timezone (defaults fill from current wall time). */
	private withWallTime = (value: PickerValidDate, hours: number, minutes?: number, seconds?: number, ms?: number): JalaliX => {
		const current = this.asJalaliX(value).clone()
		current.setHours(hours, minutes ?? current.getMinutes(), seconds ?? current.getSeconds(), ms ?? current.getMilliseconds())
		return current
	}

	private weekDayName = (value: JalaliX): string => WEEKDAY_NAMES[this.getDayOfWeek(value) - 1]
	private weekDayLetter = (value: JalaliX): string => WEEKDAY_LETTERS[this.getDayOfWeek(value) - 1]

	/**
	 * Builds a JalaliX date from a value, or returns “now” / `null`.
	 * @param value - ISO/string/timestamp to parse; `undefined` -> now; `null` -> `null`.
	 * @param timezone - MUI timezone (`'default'`, `'system'`, or IANA name).
	 * @returns A {@link JalaliX} instance, `null`, or an invalid date on parse failure.
	 */
	public date = <T extends string | null | undefined>(value?: T, timezone: PickersTimezone = 'default'): DateBuilderReturnType<T> => {
		type R = DateBuilderReturnType<T>

		if (value === null) return null as unknown as R

		if (value === undefined) {
			return this.withTimezone(new JalaliX(), timezone) as unknown as R
		}

		try {
			return this.withTimezone(JalaliX.create(value), timezone) as unknown as R
		} catch {
			return this.getInvalidDate() as unknown as R
		}
	}

	/**
	 * Returns an invalid JalaliX date (`NaN` timestamp) for failed parses.
	 * @returns Invalid {@link JalaliX} instance.
	 */
	public getInvalidDate = (): JalaliX => new JalaliX(Number.NaN)

	/**
	 * Resolves the timezone string for a picker value.
	 * @param value - Date value, or `null`.
	 * @returns IANA timezone, `'default'` if `value` is null, or `'system'` on error.
	 */
	public getTimezone = (value: PickerValidDate | null): string => {
		if (value == null) return 'default'
		try {
			return this.asJalaliX(value).getTimezone()
		} catch {
			return 'system'
		}
	}

	/**
	 * Returns a copy of `value` in the given timezone (instant-preserving).
	 * @param value - Source date.
	 * @param timezone - Target timezone (`'default'` / `'system'` / IANA / `'UTC'`).
	 * @returns JalaliX in the requested timezone.
	 */
	public setTimezone = (value: PickerValidDate, timezone: PickersTimezone): JalaliX => {
		return this.asJalaliX(value).setTimezone(timezone)
	}

	/**
	 * Converts a picker value to a native JavaScript `Date`.
	 * @param value - Picker date.
	 * @returns Equivalent `Date` (same epoch ms).
	 */
	public toJsDate = (value: PickerValidDate): Date => new Date(this.asJalaliX(value).getTime())

	/**
	 * Parses a user-entered string with the given format into a JalaliX date.
	 * Uses {@link JalaliX.parseJalali} for common `YYYY/MM/DD` keyboard formats;
	 * otherwise tokenizes `format` (Persian digits accepted).
	 * @param value - Input string (empty -> `null`).
	 * @param format - Format pattern (e.g. `'YYYY/MM/DD'`, `'D MMM YYYY'`).
	 * @returns Parsed {@link JalaliX}, `null` if empty, or an invalid date on failure.
	 */
	public parse = (value: string, format: string): JalaliX | null => {
		if (value === '') return null

		const normalized = JalaliX.fromPersian(String(value)).trim()
		const expanded = this.expandFormat(format)

		// Fast path: JalaliX native parse for common keyboard formats
		if (/^YYYY[/.-]MM[/.-]DD(?:[ T]HH:mm(?::ss)?)?$/.test(expanded.replace(/\s+/g, ' ').trim()) || /^YYYY[/.-]MM[/.-]DD$/.test(expanded)) {
			try {
				return JalaliX.parseJalali(normalized)
			} catch {
				return this.getInvalidDate()
			}
		}

		return this.parseWithFormat(normalized, expanded)
	}

	private parseWithFormat = (value: string, format: string): JalaliX | null => {
		const tokenOrder: Array<{ key: string; pattern: string }> = []
		let regexSource = ''
		let i = 0

		const tokens: Array<{ key: string; pattern: string }> = [
			{ key: 'YYYY', pattern: '(\\d{4})' },
			{ key: 'MMMM', pattern: `(${MONTH_NAMES.join('|')})` },
			{ key: 'MMM', pattern: `(${MONTH_NAMES.join('|')})` },
			{ key: 'MM', pattern: '(\\d{1,2})' },
			{ key: 'DD', pattern: '(\\d{1,2})' },
			{ key: 'HH', pattern: '(\\d{1,2})' },
			{ key: 'hh', pattern: '(\\d{1,2})' },
			{ key: 'mm', pattern: '(\\d{1,2})' },
			{ key: 'ss', pattern: '(\\d{1,2})' },
			{ key: 'A', pattern: '(ق\\.ظ\\.|ب\\.ظ\\.|AM|PM|am|pm)' },
			{ key: 'a', pattern: '(ق\\.ظ\\.|ب\\.ظ\\.|AM|PM|am|pm)' },
			{ key: 'YY', pattern: '(\\d{2})' },
			{ key: 'M', pattern: '(\\d{1,2})' },
			{ key: 'D', pattern: '(\\d{1,2})' },
			{ key: 'H', pattern: '(\\d{1,2})' },
			{ key: 'h', pattern: '(\\d{1,2})' },
			{ key: 'm', pattern: '(\\d{1,2})' },
			{ key: 's', pattern: '(\\d{1,2})' }
		]

		while (i < format.length) {
			if (format[i] === this.escapedCharacters.start) {
				const end = format.indexOf(this.escapedCharacters.end, i + 1)

				if (end === -1) {
					regexSource += escapeRegExp(format[i])
					i += 1
					continue
				}

				regexSource += escapeRegExp(format.slice(i + 1, end))
				i = end + 1
				continue
			}

			const matched = tokens.find(token => format.startsWith(token.key, i))

			if (matched) {
				tokenOrder.push(matched)
				regexSource += matched.pattern
				i += matched.key.length
				continue
			}

			regexSource += escapeRegExp(format[i])
			i += 1
		}

		const match = value.match(new RegExp(`^${regexSource}$`))

		if (!match) return this.getInvalidDate()

		let year = new JalaliX().getFullYear()
		let month = 1
		let day = 1
		let hours = 0
		let minutes = 0
		let seconds = 0
		let isPM: boolean | null = null
		let hour12: number | null = null

		tokenOrder.forEach((token, index) => {
			const raw = match[index + 1]

			switch (token.key) {
				case 'YYYY':
					year = Number(raw)
					break
				case 'YY':
					year = 1400 + Number(raw)
					break
				case 'MMMM':
				case 'MMM': {
					const monthIndex = MONTH_NAMES.indexOf(raw)
					if (monthIndex >= 0) month = monthIndex + 1
					break
				}
				case 'MM':
				case 'M':
					month = Number(raw)
					break
				case 'DD':
				case 'D':
					day = Number(raw)
					break
				case 'HH':
				case 'H':
					hours = Number(raw)
					break
				case 'hh':
				case 'h':
					hour12 = Number(raw)
					break
				case 'mm':
				case 'm':
					minutes = Number(raw)
					break
				case 'ss':
				case 's':
					seconds = Number(raw)
					break
				case 'A':
				case 'a':
					isPM = /ب\.ظ\.|pm/i.test(raw)
					break
				default:
					break
			}
		})

		if (hour12 !== null) {
			if (isPM === true && hour12 < 12) hours = hour12 + 12
			else if (isPM === false && hour12 === 12) hours = 0
			else hours = hour12
		}

		if (month < 1 || month > 12 || day < 1 || day > 31) return this.getInvalidDate()

		const output = new JalaliX()
		output.setFullYear(year, month - 1, day)
		output.setHours(hours, minutes, seconds, 0)
		return output
	}

	/**
	 * @returns Active locale code, or `'fa'` when unset.
	 */
	public getCurrentLocaleCode = (): string => this.locale || 'fa'

	/**
	 * Whether the current locale prefers a 12-hour clock (`en*` -> true).
	 * @returns `true` for English locales; otherwise `false`.
	 */
	public is12HourCycleInCurrentLocale = (): boolean => {
		const locale = this.getCurrentLocaleCode().toLowerCase()
		return locale.startsWith('en')
	}

	/**
	 * Normalizes MUI/localized format aliases to JalaliX tokens
	 * (`MMMM`->`MMM`, `dddd`/`ddd`->`WN`, word-boundary `dd`->`WL`).
	 * @param format - Format string from formats map or field props.
	 * @returns Expanded format string for {@link formatByString} / {@link parse}.
	 */
	public expandFormat = (format: string): string => {
		// JalaliX has no localized meta-tokens (L/LL/LT); keep format as-is aside from MMMM->MMM.
		return format
			.replace(/MMMM/g, 'MMM')
			.replace(/dddd/g, 'WN')
			.replace(/ddd/g, 'WN')
			.replace(/\bdd\b/g, 'WL')
	}

	/**
	 * @param value - Value to validate.
	 * @returns Whether `value` is a valid {@link JalaliX} / Date.
	 */
	public isValid = (value: PickerValidDate | null): value is PickerValidDate => {
		if (value == null) return false

		return JalaliX.isValidDate(this.asJalaliX(value))
	}

	/**
	 * Formats a date using a named key from {@link formats}.
	 * @param value - Date to format.
	 * @param formatKey - Key in {@link AdapterFormats} (e.g. `'fullDate'`, `'keyboardDate'`).
	 * @returns Formatted string.
	 */
	public format = (value: PickerValidDate, formatKey: keyof AdapterFormats): string => {
		return this.formatByString(value, this.formats[formatKey])
	}

	/**
	 * Formats a date with an explicit JalaliX format string.
	 * Protects weekday tokens (`WN`/`WL`) that would otherwise collide with week-number `W`.
	 * @param value - Date to format.
	 * @param formatString - Pattern (e.g. `'YYYY/MM/DD'`, `'WN D MMM YYYY'`).
	 * @returns Formatted string.
	 */
	public formatByString = (value: PickerValidDate, formatString: string): string => {
		const date = this.asJalaliX(value)
		const expanded = this.expandFormat(formatString)

		// JalaliX replaces bare `W` (week number) before `WN`/`WL`, so protect weekday tokens.
		const placeholders: string[] = []

		const ph = (text: string): string => {
			const i = placeholders.length
			placeholders.push(text)
			return `\uE100${i}\uE101`
		}

		const safe = expanded
			.replace(/WN/g, () => ph(this.weekDayName(date)))
			.replace(/wn/g, () => ph(this.weekDayName(date)))
			.replace(/WL/g, () => ph(this.weekDayLetter(date)))
			.replace(/wl/g, () => ph(this.weekDayLetter(date)))

		let output = date.format(safe)

		placeholders.forEach((text, i) => {
			output = output.replace(new RegExp(`\uE100${i}\uE101`, 'g'), () => text)
		})

		return output
	}

	/**
	 * Localizes digits for field display (Western -> Persian; `,` -> `،`).
	 * @param numberToFormat - Digit string from MUI fields.
	 * @returns String with Persian numerals.
	 */
	public formatNumber = (numberToFormat: string): string => JalaliX.toPersian(numberToFormat).replace(/,/g, '،')

	/**
	 * @param value - First date (or `null`).
	 * @param comparing - Second date (or `null`).
	 * @returns `true` if both null or same epoch ms.
	 */
	public isEqual = (value: PickerValidDate | null, comparing: PickerValidDate | null): boolean => {
		if (value === null && comparing === null) return true
		if (value === null || comparing === null) return false
		return this.asJalaliX(value).getTime() === this.asJalaliX(comparing).getTime()
	}

	/** @returns Whether both dates share the same Jalali year. */
	public isSameYear = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.getYear(value) === this.getYear(comparing)
	}

	/** @returns Whether both dates share the same Jalali year and month. */
	public isSameMonth = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.isSameYear(value, comparing) && this.getMonth(value) === this.getMonth(comparing)
	}

	/** @returns Whether both dates fall on the same Jalali calendar day. */
	public isSameDay = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.isSameMonth(value, comparing) && this.getDate(value) === this.getDate(comparing)
	}

	/** @returns Whether both dates share the same day and hour. */
	public isSameHour = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.isSameDay(value, comparing) && this.getHours(value) === this.getHours(comparing)
	}

	/** @returns Whether `value` is strictly after `comparing` by timestamp. */
	public isAfter = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.asJalaliX(value).getTime() > this.asJalaliX(comparing).getTime()
	}

	/** @returns Whether `value`'s Jalali year is after `comparing`'s. */
	public isAfterYear = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.getYear(value) > this.getYear(comparing)
	}

	/** @returns Whether `value`'s calendar day is after `comparing`'s. */
	public isAfterDay = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return !this.isSameDay(value, comparing) && this.isAfter(this.startOfDay(value), this.startOfDay(comparing))
	}

	/** @returns Whether `value` is strictly before `comparing` by timestamp. */
	public isBefore = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.asJalaliX(value).getTime() < this.asJalaliX(comparing).getTime()
	}

	/** @returns Whether `value`'s Jalali year is before `comparing`'s. */
	public isBeforeYear = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return this.getYear(value) < this.getYear(comparing)
	}

	/** @returns Whether `value`'s calendar day is before `comparing`'s. */
	public isBeforeDay = (value: PickerValidDate, comparing: PickerValidDate): boolean => {
		return !this.isSameDay(value, comparing) && this.isBefore(this.startOfDay(value), this.startOfDay(comparing))
	}

	/**
	 * @param value - Date to test.
	 * @param range - Inclusive `[start, end]` bounds.
	 * @returns Whether `value` lies within the range by timestamp.
	 */
	public isWithinRange = (value: PickerValidDate, range: [PickerValidDate, PickerValidDate]): boolean => {
		const time = this.asJalaliX(value).getTime()

		return time >= this.asJalaliX(range[0]).getTime() && time <= this.asJalaliX(range[1]).getTime()
	}

	/**
	 * @param value - Reference date.
	 * @returns Start of that Jalali year (Farvardin 1, 00:00:00.000).
	 */
	public startOfYear = (value: PickerValidDate): JalaliX => {
		return this.setJalaliParts(value, this.getYear(value), 0, 1, 0, 0, 0, 0)
	}

	/**
	 * @param value - Reference date.
	 * @returns Start of that Jalali month (day 1, 00:00:00.000).
	 */
	public startOfMonth = (value: PickerValidDate): JalaliX => {
		return this.setJalaliParts(value, this.getYear(value), this.getMonth(value), 1, 0, 0, 0, 0)
	}

	/**
	 * Persian week starts on Saturday.
	 * @param value - Reference date.
	 * @returns Start of that week (Saturday 00:00:00.000).
	 */
	public startOfWeek = (value: PickerValidDate): JalaliX => {
		const dayOfWeek = this.getDayOfWeek(value)

		return this.startOfDay(this.addDays(value, 1 - dayOfWeek))
	}

	/**
	 * @param value - Reference date.
	 * @returns Same calendar day at 00:00:00.000 local wall time.
	 */
	public startOfDay = (value: PickerValidDate): JalaliX => {
		return this.withWallTime(value, 0, 0, 0, 0)
	}

	/**
	 * @param value - Reference date.
	 * @returns End of that Jalali year (last moment of Esfand).
	 */
	public endOfYear = (value: PickerValidDate): JalaliX => {
		return this.endOfMonth(this.setJalaliParts(value, this.getYear(value), 11, 1, 12, 0, 0, 0))
	}

	/**
	 * @param value - Reference date.
	 * @returns End of that Jalali month (23:59:59.999 on the last day).
	 */
	public endOfMonth = (value: PickerValidDate): JalaliX => {
		const days = this.getDaysInMonth(value)

		return this.setJalaliParts(value, this.getYear(value), this.getMonth(value), days, 23, 59, 59, 999)
	}

	/**
	 * Persian week ends on Friday.
	 * @param value - Reference date.
	 * @returns End of that week (Friday 23:59:59.999).
	 */
	public endOfWeek = (value: PickerValidDate): JalaliX => {
		const dayOfWeek = this.getDayOfWeek(value)

		return this.endOfDay(this.addDays(value, 7 - dayOfWeek))
	}

	/**
	 * @param value - Reference date.
	 * @returns Same calendar day at 23:59:59.999 local wall time.
	 */
	public endOfDay = (value: PickerValidDate): JalaliX => {
		return this.withWallTime(value, 23, 59, 59, 999)
	}

	/**
	 * @param value - Source date.
	 * @param amount - Years to add (may be negative).
	 * @returns New JalaliX with year adjusted.
	 */
	public addYears = (value: PickerValidDate, amount: number): JalaliX => this.setYear(value, this.getYear(value) + amount)

	/**
	 * Adds months with day clamping to the target month length.
	 * @param value - Source date.
	 * @param amount - Months to add (may be negative).
	 * @returns New JalaliX with month adjusted.
	 */
	public addMonths = (value: PickerValidDate, amount: number): JalaliX => {
		const current = this.asJalaliX(value)
		const totalMonths = this.getYear(current) * 12 + this.getMonth(current) + amount
		const year = Math.floor(totalMonths / 12)
		const month = ((totalMonths % 12) + 12) % 12
		const maxDay = this.getDaysInMonth(this.setJalaliParts(current, year, month, 1, 12))
		const day = Math.min(this.getDate(current), maxDay)

		return this.setJalaliParts(current, year, month, day, current.getHours(), current.getMinutes(), current.getSeconds(), current.getMilliseconds())
	}

	/**
	 * @param value - Source date.
	 * @param amount - Weeks to add (may be negative).
	 * @returns New JalaliX with days shifted by `amount * 7`.
	 */
	public addWeeks = (value: PickerValidDate, amount: number): JalaliX => this.addDays(value, amount * 7)

	/**
	 * Adds calendar days (wall time preserved via JalaliX timezone-aware setters).
	 * @param value - Source date.
	 * @param amount - Days to add (may be negative).
	 * @returns New JalaliX with day adjusted.
	 */
	public addDays = (value: PickerValidDate, amount: number): JalaliX => {
		return this.asJalaliX(value).clone().addDays(amount)
	}

	/**
	 * @param value - Source date.
	 * @param amount - Hours to add (may be negative).
	 * @returns New JalaliX with timestamp shifted by hours.
	 */
	public addHours = (value: PickerValidDate, amount: number): JalaliX => {
		const result = this.asJalaliX(value).clone()
		result.setTime(result.getTime() + amount * 3_600_000)

		return result
	}

	/**
	 * @param value - Source date.
	 * @param amount - Minutes to add (may be negative).
	 * @returns New JalaliX with timestamp shifted by minutes.
	 */
	public addMinutes = (value: PickerValidDate, amount: number): JalaliX => {
		const result = this.asJalaliX(value).clone()
		result.setTime(result.getTime() + amount * 60_000)

		return result
	}

	/**
	 * @param value - Source date.
	 * @param amount - Seconds to add (may be negative).
	 * @returns New JalaliX with timestamp shifted by seconds.
	 */
	public addSeconds = (value: PickerValidDate, amount: number): JalaliX => {
		const result = this.asJalaliX(value).clone()
		result.setTime(result.getTime() + amount * 1_000)

		return result
	}

	/** @returns Jalali year. */
	public getYear = (value: PickerValidDate): number => this.asJalaliX(value).getFullYear()

	/**
	 * 0-based Jalali month (0 = Farvardin).
	 * @returns Month index 0–11.
	 */
	public getMonth = (value: PickerValidDate): number => this.asJalaliX(value).getMonth() - 1

	/** @returns Day of month (1–31). */
	public getDate = (value: PickerValidDate): number => this.asJalaliX(value).getDate()

	/** @returns Hours (0–23). */
	public getHours = (value: PickerValidDate): number => this.asJalaliX(value).getHours()

	/** @returns Minutes (0–59). */
	public getMinutes = (value: PickerValidDate): number => this.asJalaliX(value).getMinutes()

	/** @returns Seconds (0–59). */
	public getSeconds = (value: PickerValidDate): number => this.asJalaliX(value).getSeconds()

	/** @returns Milliseconds (0–999). */
	public getMilliseconds = (value: PickerValidDate): number => this.asJalaliX(value).getMilliseconds()

	/**
	 * @param value - Source date.
	 * @param year - Jalali year to set.
	 * @returns New JalaliX with year replaced (month/day/time preserved).
	 */
	public setYear = (value: PickerValidDate, year: number): JalaliX => {
		const current = this.asJalaliX(value)

		return this.setJalaliParts(
			current,
			year,
			current.getMonth() - 1,
			current.getDate(),
			current.getHours(),
			current.getMinutes(),
			current.getSeconds(),
			current.getMilliseconds()
		)
	}

	/**
	 * @param value - Source date.
	 * @param month - 0-based Jalali month (0 = Farvardin).
	 * @returns New JalaliX with month replaced.
	 */
	public setMonth = (value: PickerValidDate, month: number): JalaliX => {
		const current = this.asJalaliX(value)

		return this.setJalaliParts(
			current,
			current.getFullYear(),
			month,
			current.getDate(),
			current.getHours(),
			current.getMinutes(),
			current.getSeconds(),
			current.getMilliseconds()
		)
	}

	/**
	 * @param value - Source date.
	 * @param date - Day of month to set.
	 * @returns New JalaliX with day replaced.
	 */
	public setDate = (value: PickerValidDate, date: number): JalaliX => {
		const current = this.asJalaliX(value)

		return this.setJalaliParts(
			current,
			current.getFullYear(),
			current.getMonth() - 1,
			date,
			current.getHours(),
			current.getMinutes(),
			current.getSeconds(),
			current.getMilliseconds()
		)
	}

	/**
	 * @param value - Source date.
	 * @param hours - Hours to set (0–23).
	 * @returns New JalaliX with hours replaced.
	 */
	public setHours = (value: PickerValidDate, hours: number): JalaliX => this.withWallTime(value, hours)

	/**
	 * @param value - Source date.
	 * @param minutes - Minutes to set.
	 * @returns New JalaliX with minutes replaced.
	 */
	public setMinutes = (value: PickerValidDate, minutes: number): JalaliX => {
		const current = this.asJalaliX(value)

		return this.withWallTime(current, current.getHours(), minutes)
	}

	/**
	 * @param value - Source date.
	 * @param seconds - Seconds to set.
	 * @returns New JalaliX with seconds replaced.
	 */
	public setSeconds = (value: PickerValidDate, seconds: number): JalaliX => {
		const current = this.asJalaliX(value)

		return this.withWallTime(current, current.getHours(), current.getMinutes(), seconds)
	}

	/**
	 * @param value - Source date.
	 * @param milliseconds - Milliseconds to set.
	 * @returns New JalaliX with milliseconds replaced.
	 */
	public setMilliseconds = (value: PickerValidDate, milliseconds: number): JalaliX => {
		const current = this.asJalaliX(value)

		return this.withWallTime(current, current.getHours(), current.getMinutes(), current.getSeconds(), milliseconds)
	}

	/**
	 * Days in the Jalali month of `value` (31 / 30 / 29–30 for Esfand).
	 * @param value - Reference date.
	 * @returns Day count for that month.
	 */
	public getDaysInMonth = (value: PickerValidDate): number => {
		const month = this.getMonth(value) // 0-based

		if (month <= 5) return 31
		if (month <= 10) return 30

		// Esfand: leap years have 30 days
		const probe = this.asJalaliX(value).clone()
		probe.setFullYear(this.getYear(value), 11, 30)

		return probe.getMonth() === 12 && probe.getDate() === 30 ? 30 : 29
	}

	/**
	 * Builds the month grid as weeks (Saturday-start) for calendar UIs.
	 * @param value - Any date in the target month.
	 * @returns Array of weeks; each week is seven {@link JalaliX} days.
	 */
	public getWeekArray = (value: PickerValidDate): JalaliX[][] => {
		const start = this.startOfWeek(this.startOfMonth(value))
		const end = this.endOfWeek(this.endOfMonth(value))

		let count = 0
		let current = start
		const nestedWeeks: JalaliX[][] = []

		while (!this.isAfter(current, end)) {
			const weekNumber = Math.floor(count / 7)
			nestedWeeks[weekNumber] = nestedWeeks[weekNumber] || []
			nestedWeeks[weekNumber].push(current)

			current = this.addDays(current, 1)
			count += 1
		}

		return nestedWeeks
	}

	/**
	 * @param value - Reference date.
	 * @returns Jalali week-of-year (1–53).
	 */
	public getWeekNumber = (value: PickerValidDate): number => this.asJalaliX(value).getWeekOfYear()

	/**
	 * 1-based day of week with Saturday as the first day (Persian week).
	 * @param value - Reference date.
	 * @returns 1 (Saturday) … 7 (Friday).
	 */
	public getDayOfWeek = (value: PickerValidDate): number => {
		const day = this.asJalaliX(value).getDay()

		return day === 0 ? 7 : day
	}

	/**
	 * Lists year-start dates from `start` through `end` (inclusive range walk).
	 * @param range - `[start, end]` picker dates.
	 * @returns One {@link JalaliX} per year at start-of-year.
	 */
	public getYearRange = ([start, end]: [PickerValidDate, PickerValidDate]): JalaliX[] => {
		const startDate = this.startOfYear(start)
		const endDate = this.endOfYear(end)
		const years: JalaliX[] = []

		let current = startDate

		while (this.isBefore(current, endDate)) {
			years.push(current)
			current = this.addYears(current, 1)
		}

		return years
	}

	/**
	 * Optional helper for older pickers / custom UIs.
	 * @param ampm - `'am'` or `'pm'`.
	 * @returns Persian meridiem (`ق.ظ.` / `ب.ظ.`).
	 */
	public getMeridiemText = (ampm: 'am' | 'pm'): string => (ampm === 'am' ? 'ق.ظ.' : 'ب.ظ.')
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

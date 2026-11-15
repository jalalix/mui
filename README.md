# JalaliX - MUI

Jalali (Persian/Shamsi) adapter for [MUI X Date Pickers](https://mui.com/x/react-date-pickers/), powered by [`@jalalix/typescript`](https://www.npmjs.com/package/@jalalix/typescript).

## Install

```bash
npm install @jalalix/mui @jalalix/typescript @mui/x-date-pickers
```

Peer dependencies: `react` (^17 || ^18 || ^19) and `@mui/x-date-pickers` (^6 || ^7 || ^8 || ^9).

## Usage

```tsx
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateTimeField } from '@mui/x-date-pickers/DateTimeField'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterJalaliX, JalaliX } from '@jalalix/mui'

export function App() {
	return (
		<LocalizationProvider dateAdapter={AdapterJalaliX} adapterLocale="fa">
			<DateTimeField defaultValue={new JalaliX()} />
			<DatePicker label="تاریخ" />
		</LocalizationProvider>
	)
}
```

Keyboard formats default to Jalali-friendly patterns such as `YYYY/MM/DD` and `YYYY/MM/DD HH:mm`. Month names and weekdays render in Persian via JalaliX.

## Timezone

`AdapterJalaliX` is timezone-compatible (`isTimezoneCompatible = true`). It delegates to `@jalalix/typescript` **instant-preserving** IANA zones:

- `getTimezone(value)` / `setTimezone(value, tz)` use JalaliX
- Aliases: `default` / `local` / `system` -> host IANA; `utc` / `gmt` -> `UTC`
- Changing timezone keeps the same Unix instant; wall/Jalali display updates

```tsx
<LocalizationProvider dateAdapter={AdapterJalaliX}>
	<DateTimeField timezone="Asia/Tehran" />
</LocalizationProvider>
```

Requires `@jalalix/typescript` ^0.8.0. Compatible with MUI X Date Pickers **v6–v9** (tested against v9).

## API

```ts
import { AdapterJalaliX, JalaliX } from '@jalalix/mui'
import type { JalaliDate, JalaliOptions, JalaliFormatOptions } from '@jalalix/mui'
```

- `AdapterJalaliX` - `MuiPickersAdapter` implementation (`lib: 'jalalix'`)
- `JalaliX` - re-export of `@jalalix/typescript`

## License

MIT

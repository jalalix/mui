# Release Notes
All notable changes to this package will be documented in this file.

- Support `@mui/x-date-pickers` **v9** (peer range: ^6 || ^7 || ^8 || ^9)
- Dev/types aligned with latest MUI X Date Pickers adapter interface
- Wired timezone APIs to `@jalalix/typescript` ^0.8.0 instant-preserving IANA model
- Simplified day/time helpers (no `Date.prototype` midnight workarounds)
- Documented `DateTimeField` `timezone` usage
- Initial `AdapterJalaliX` for MUI X Date Pickers (`@mui/x-date-pickers` ^6 || ^7 || ^8)
- Jalali calendar via `@jalalix/typescript` (^0.7.0)
- Default keyboard formats: `YYYY/MM/DD`, `YYYY/MM/DD HH:mm`
- Persian month/weekday names and optional Persian digits via `formatNumber`

## 0.1.0
- Initial commit

import { test, describe, expect } from '@jest/globals';
import { getStatusColor, formatTimestamp } from '../../src/utils/formatters';
describe('formatters utility functions', function () {
    describe('getStatusColor', function () {
        test('returns "success" for completed status', function () {
            expect(getStatusColor('completed')).toBe('success');
            expect(getStatusColor('COMPLETED')).toBe('success'); // Case-insensitive
        });
        test('returns "error" for failed status', function () {
            expect(getStatusColor('failed')).toBe('error');
            expect(getStatusColor('FAILED')).toBe('error');
        });
        test('returns "processing" for active status', function () {
            expect(getStatusColor('active')).toBe('processing');
            expect(getStatusColor('ACTIVE')).toBe('processing');
        });
        test('returns "default" for waiting status', function () {
            expect(getStatusColor('waiting')).toBe('default');
            expect(getStatusColor('WAITING')).toBe('default');
        });
        test('returns "warning" for delayed status', function () {
            expect(getStatusColor('delayed')).toBe('warning');
            expect(getStatusColor('DELAYED')).toBe('warning');
        });
        test('returns "purple" for paused status', function () {
            expect(getStatusColor('paused')).toBe('purple');
            expect(getStatusColor('PAUSED')).toBe('purple');
        });
        test('returns "cyan" for waiting-children status', function () {
            expect(getStatusColor('waiting-children')).toBe('cyan');
            expect(getStatusColor('WAITING-CHILDREN')).toBe('cyan');
        });
        test('returns "grey" for unknown status', function () {
            expect(getStatusColor('unknown')).toBe('grey');
            expect(getStatusColor('UNKNOWN')).toBe('grey');
        });
        test('returns "magenta" for error status', function () {
            expect(getStatusColor('error')).toBe('magenta');
            expect(getStatusColor('ERROR')).toBe('magenta');
        });
        test('returns "default" for unhandled status', function () {
            expect(getStatusColor('someotherstate')).toBe('default');
            expect(getStatusColor('')).toBe('default');
        });
    });
    describe('formatTimestamp', function () {
        test('returns formatted date string for valid timestamp', function () {
            var timestamp = 1609459200000; // 2021-01-01 00:00:00 UTC
            // Get expected format (will vary based on locale)
            var expected = new Date(timestamp).toLocaleString();
            expect(formatTimestamp(timestamp)).toBe(expected);
        });
        test('returns "N/A" for null', function () {
            expect(formatTimestamp(null)).toBe('N/A');
        });
        test('returns "N/A" for undefined', function () {
            expect(formatTimestamp(undefined)).toBe('N/A');
        });
        test('formats timestamp 0 correctly', function () {
            // Timestamp 0 represents 1970-01-01 00:00:00 UTC
            var expected = new Date(0).toLocaleString();
            expect(formatTimestamp(0)).toBe(expected);
        });
        test('handles negative timestamps (dates before 1970)', function () {
            var negativeTimestamp = -1000000000; // Some date before 1970
            var expected = new Date(negativeTimestamp).toLocaleString();
            expect(formatTimestamp(negativeTimestamp)).toBe(expected);
        });
    });
});

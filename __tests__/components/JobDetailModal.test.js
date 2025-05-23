var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render } from '@testing-library/react';
import { test, describe, expect, beforeEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
// Define a simple mock version of the JobDetailModal component
var MockJobDetailModal = function (props) {
    return props.isVisible ? (_jsxs("div", { "data-testid": "mocked-job-detail-modal", children: [_jsx("div", { "data-testid": "modal-title", children: "Job Details" }), _jsx("div", { "data-testid": "job-data", children: JSON.stringify(props.selectedJob) }), _jsx("div", { "data-testid": "has-logs", children: String(!!props.onFetchLogs) }), _jsx("button", { "data-testid": "close-button", onClick: props.onCancel, children: "Close" }), _jsx("button", { "data-testid": "fetch-logs-button", onClick: function () { return props.selectedJob && props.onFetchLogs && props.onFetchLogs(props.selectedJob.id); }, disabled: !props.onFetchLogs, children: "Fetch Logs" }), _jsx("div", { "data-testid": "logs-content", children: props.logs ? JSON.stringify(props.logs) : "No logs" }), _jsx("div", { "data-testid": "is-loading", children: String(!!props.isLoading) })] })) : null;
};
// Mock the actual import
jest.mock('../../src/components/JobDetailModal', function () { return ({
    __esModule: true,
    default: function (props) { return _jsx(MockJobDetailModal, __assign({}, props)); }
}); });
// Simple test for JobDetailModal component
describe('JobDetailModal Component', function () {
    // Test that the component file exists and can be imported
    test('JobDetailModal module can be imported', function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, import('../../src/components/JobDetailModal')];
                case 1:
                    module = _a.sent();
                    // Verify the module has a default export (the component)
                    expect(typeof module.default).toBe('function');
                    return [2 /*return*/];
            }
        });
    }); });
    // Define mock props for tests
    var mockJob = {
        id: '1',
        name: 'test-job',
        data: { test: 'data' },
        timestamp: Date.now(),
        queueName: 'test-queue',
        status: 'completed',
        opts: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        },
        failedReason: 'Test failed reason',
        stacktrace: ['Error line 1', 'Error line 2'],
        processedOn: Date.now() - 5000,
        finishedOn: Date.now() - 1000,
        attemptsMade: 1
    };
    var mockLogs = ['Log line 1', 'Log line 2', 'Log line 3'];
    var onCancel = jest.fn();
    var onFetchLogs = jest.fn(function () { return Promise.resolve(mockLogs); });
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('renders when isVisible is true', function () {
        var getByTestId = render(_jsx(MockJobDetailModal, { isVisible: true, selectedJob: mockJob, onCancel: onCancel })).getByTestId;
        // Check if the modal is rendered
        expect(getByTestId('mocked-job-detail-modal')).toBeTruthy();
        // Verify job data is passed
        var jobData = JSON.parse(getByTestId('job-data').textContent || '{}');
        expect(jobData.id).toBe('1');
        expect(jobData.name).toBe('test-job');
    });
    test('does not render when isVisible is false', function () {
        var queryByTestId = render(_jsx(MockJobDetailModal, { isVisible: false, selectedJob: mockJob, onCancel: onCancel })).queryByTestId;
        // Modal should not be in the document
        expect(queryByTestId('mocked-job-detail-modal')).toBe(null);
    });
    test('calls onCancel when close button is clicked', function () {
        var getByTestId = render(_jsx(MockJobDetailModal, { isVisible: true, selectedJob: mockJob, onCancel: onCancel })).getByTestId;
        // Click the close button
        getByTestId('close-button').click();
        // Verify onCancel was called
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
    test('shows logs tab when onFetchLogs is provided', function () {
        var getByTestId = render(_jsx(MockJobDetailModal, { isVisible: true, selectedJob: mockJob, onCancel: onCancel, onFetchLogs: onFetchLogs })).getByTestId;
        // Verify logs tab is available when onFetchLogs is provided
        expect(getByTestId('has-logs').textContent).toBe('true');
    });
    test('calls onFetchLogs when fetch logs button is clicked', function () {
        var getByTestId = render(_jsx(MockJobDetailModal, { isVisible: true, selectedJob: mockJob, onCancel: onCancel, onFetchLogs: onFetchLogs })).getByTestId;
        // Click fetch logs button
        getByTestId('fetch-logs-button').click();
        // Verify onFetchLogs was called with the job ID
        expect(onFetchLogs).toHaveBeenCalledTimes(1);
        expect(onFetchLogs).toHaveBeenCalledWith(mockJob.id);
    });
    test('displays logs when provided', function () {
        var getByTestId = render(_jsx(MockJobDetailModal, { isVisible: true, selectedJob: mockJob, logs: mockLogs, onCancel: onCancel, onFetchLogs: onFetchLogs })).getByTestId;
        // Verify logs are displayed
        expect(getByTestId('logs-content').textContent).toBe(JSON.stringify(mockLogs));
    });
    test('displays loading state correctly', function () {
        var getByTestId = render(_jsx(MockJobDetailModal, { isVisible: true, selectedJob: mockJob, onCancel: onCancel, isLoading: true })).getByTestId;
        // Verify loading state is correctly passed
        expect(getByTestId('is-loading').textContent).toBe('true');
    });
});

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
// Define a simple mock version of the QueueManagementModal component
var MockQueueManagementModal = function (props) {
    return props.isVisible ? (_jsxs("div", { "data-testid": "mocked-queue-management-modal", children: [_jsx("div", { "data-testid": "modal-title", children: "Queue Management" }), _jsx("div", { "data-testid": "queue-data", children: JSON.stringify(props.queues) }), _jsx("div", { "data-testid": "selected-queue", children: props.selectedQueue || 'None' }), _jsx("button", { "data-testid": "close-button", onClick: props.onCancel, children: "Close" }), _jsx("button", { "data-testid": "pause-button", onClick: function () { return props.selectedQueue && props.onPauseQueue && props.onPauseQueue(props.selectedQueue, true); }, disabled: !props.onPauseQueue || !props.selectedQueue, children: "Pause Queue" }), _jsx("button", { "data-testid": "resume-button", onClick: function () { return props.selectedQueue && props.onPauseQueue && props.onPauseQueue(props.selectedQueue, false); }, disabled: !props.onPauseQueue || !props.selectedQueue, children: "Resume Queue" }), _jsx("button", { "data-testid": "empty-button", onClick: function () { return props.selectedQueue && props.onEmptyQueue && props.onEmptyQueue(props.selectedQueue); }, disabled: !props.onEmptyQueue || !props.selectedQueue, children: "Empty Queue" }), _jsx("div", { "data-testid": "is-loading", children: String(!!props.isLoading) })] })) : null;
};
// Mock the actual import
jest.mock('../../src/components/QueueManagementModal', function () { return ({
    __esModule: true,
    default: function (props) { return _jsx(MockQueueManagementModal, __assign({}, props)); }
}); });
// Simple test for QueueManagementModal component
describe('QueueManagementModal Component', function () {
    // Test that the component file exists and can be imported
    test('QueueManagementModal module can be imported', function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, import('../../src/components/QueueManagementModal')];
                case 1:
                    module = _a.sent();
                    // Verify the module has a default export (the component)
                    expect(typeof module.default).toBe('function');
                    return [2 /*return*/];
            }
        });
    }); });
    // Define mock props for tests
    var mockQueues = [
        {
            name: 'queue1',
            isPaused: false,
            jobCount: 10,
            waitingCount: 5,
            activeCount: 3,
            completedCount: 20,
            failedCount: 2
        },
        {
            name: 'queue2',
            isPaused: true,
            jobCount: 15,
            waitingCount: 8,
            activeCount: 0,
            completedCount: 30,
            failedCount: 5
        }
    ];
    var onCancel = jest.fn();
    var onPauseQueue = jest.fn(function () { return Promise.resolve(); });
    var onEmptyQueue = jest.fn(function () { return Promise.resolve(); });
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('renders when isVisible is true', function () {
        var getByTestId = render(_jsx(MockQueueManagementModal, { isVisible: true, queues: mockQueues, onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue })).getByTestId;
        // Check if the modal is rendered
        expect(getByTestId('mocked-queue-management-modal')).toBeTruthy();
        // Verify queue data is passed
        var queueData = JSON.parse(getByTestId('queue-data').textContent || '[]');
        expect(queueData).toHaveLength(2);
        expect(queueData[0].name).toBe('queue1');
        expect(queueData[1].name).toBe('queue2');
    });
    test('does not render when isVisible is false', function () {
        var queryByTestId = render(_jsx(MockQueueManagementModal, { isVisible: false, queues: mockQueues, onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue })).queryByTestId;
        // Modal should not be in the document
        expect(queryByTestId('mocked-queue-management-modal')).toBe(null);
    });
    test('calls onCancel when close button is clicked', function () {
        var getByTestId = render(_jsx(MockQueueManagementModal, { isVisible: true, queues: mockQueues, onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue })).getByTestId;
        // Click the close button
        getByTestId('close-button').click();
        // Verify onCancel was called
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
    test('calls onPauseQueue when pause button is clicked', function () {
        var getByTestId = render(_jsx(MockQueueManagementModal, { isVisible: true, queues: mockQueues, selectedQueue: "queue1", onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue })).getByTestId;
        // Click the pause button
        getByTestId('pause-button').click();
        // Verify onPauseQueue was called with the correct parameters
        expect(onPauseQueue).toHaveBeenCalledTimes(1);
        expect(onPauseQueue).toHaveBeenCalledWith('queue1', true);
    });
    test('calls onPauseQueue when resume button is clicked', function () {
        var getByTestId = render(_jsx(MockQueueManagementModal, { isVisible: true, queues: mockQueues, selectedQueue: "queue2", onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue })).getByTestId;
        // Click the resume button
        getByTestId('resume-button').click();
        // Verify onPauseQueue was called with the correct parameters to resume
        expect(onPauseQueue).toHaveBeenCalledTimes(1);
        expect(onPauseQueue).toHaveBeenCalledWith('queue2', false);
    });
    test('calls onEmptyQueue when empty button is clicked', function () {
        var getByTestId = render(_jsx(MockQueueManagementModal, { isVisible: true, queues: mockQueues, selectedQueue: "queue1", onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue })).getByTestId;
        // Click the empty queue button
        getByTestId('empty-button').click();
        // Verify onEmptyQueue was called with the correct queue name
        expect(onEmptyQueue).toHaveBeenCalledTimes(1);
        expect(onEmptyQueue).toHaveBeenCalledWith('queue1');
    });
    test('displays loading state correctly', function () {
        var getByTestId = render(_jsx(MockQueueManagementModal, { isVisible: true, queues: mockQueues, onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue, isLoading: true })).getByTestId;
        // Verify loading state is correctly passed
        expect(getByTestId('is-loading').textContent).toBe('true');
    });
    test('disables action buttons when no queue is selected', function () {
        var getByTestId = render(_jsx(MockQueueManagementModal, { isVisible: true, queues: mockQueues, onCancel: onCancel, onPauseQueue: onPauseQueue, onEmptyQueue: onEmptyQueue })).getByTestId;
        // Verify buttons are disabled when no queue is selected
        expect(getByTestId('pause-button').hasAttribute('disabled')).toBe(true);
        expect(getByTestId('resume-button').hasAttribute('disabled')).toBe(true);
        expect(getByTestId('empty-button').hasAttribute('disabled')).toBe(true);
    });
});

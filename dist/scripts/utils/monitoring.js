"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWorkflowError = exports.detectAnomalies = exports.getStepMetrics = exports.getWorkflowMetrics = exports.updateWorkflowMetrics = exports.logWorkflowEvent = exports.logApiError = void 0;
var supabase_admin_1 = require("./supabase-admin");
function logApiError(error, req) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabaseAdmin, errorLog, loggingError_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    supabaseAdmin = (0, supabase_admin_1.getSupabaseAdmin)();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    errorLog = {
                        endpoint: new URL(req.url).pathname,
                        method: req.method,
                        error_message: error instanceof Error ? error.message : 'Unknown error',
                        error_code: error.code || ((_a = error.statusCode) === null || _a === void 0 ? void 0 : _a.toString()),
                        stack_trace: error.stack,
                        metadata: {
                            headers: Object.fromEntries(req.headers),
                            timestamp: new Date().toISOString()
                        }
                    };
                    // Log to database if available
                    return [4 /*yield*/, supabaseAdmin
                            .from('api_error_logs')
                            .insert([errorLog])
                            .select()];
                case 2:
                    // Log to database if available
                    _b.sent();
                    // Also log to console for development
                    console.error('API Error:', __assign(__assign({}, errorLog), { stack_trace: undefined // Don't log stack trace to console
                     }));
                    return [3 /*break*/, 4];
                case 3:
                    loggingError_1 = _b.sent();
                    // Fallback to console if logging fails
                    console.error('Failed to log API error:', loggingError_1);
                    console.error('Original error:', error);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.logApiError = logApiError;
// Workflow monitoring functions
function logWorkflowEvent(event) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseAdmin, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supabaseAdmin = (0, supabase_admin_1.getSupabaseAdmin)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    // Log to workflow_monitoring table
                    return [4 /*yield*/, supabaseAdmin
                            .from('workflow_monitoring')
                            .insert([__assign(__assign({}, event), { created_at: new Date().toISOString() })])];
                case 2:
                    // Log to workflow_monitoring table
                    _a.sent();
                    // Log significant events to console
                    if (['step_failed', 'workflow_failed'].includes(event.event_type)) {
                        console.error("Workflow Error [".concat(event.workflow_id, "]:"), {
                            step: event.step,
                            error: event.error_message,
                            metadata: event.metadata
                        });
                    }
                    // Update metrics
                    return [4 /*yield*/, updateWorkflowMetrics(event)];
                case 3:
                    // Update metrics
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to log workflow event:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.logWorkflowEvent = logWorkflowEvent;
function updateWorkflowMetrics(event) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseAdmin, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supabaseAdmin = (0, supabase_admin_1.getSupabaseAdmin)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    // Update step-specific metrics
                    return [4 /*yield*/, supabaseAdmin.rpc('update_step_metrics', {
                            p_step: event.step,
                            p_duration: event.duration_ms || 0,
                            p_success: event.event_type === 'step_complete',
                            p_error: event.event_type === 'step_failed'
                        })];
                case 2:
                    // Update step-specific metrics
                    _a.sent();
                    if (!['workflow_complete', 'workflow_failed'].includes(event.event_type)) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabaseAdmin.rpc('update_workflow_metrics', {
                            p_success: event.event_type === 'workflow_complete'
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.error('Failed to update workflow metrics:', error_2);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.updateWorkflowMetrics = updateWorkflowMetrics;
function getWorkflowMetrics(start_date, end_date) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseAdmin, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supabaseAdmin = (0, supabase_admin_1.getSupabaseAdmin)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabaseAdmin
                            .rpc('get_workflow_metrics', {
                            p_start_date: start_date,
                            p_end_date: end_date
                        })];
                case 2:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
                case 3:
                    error_3 = _a.sent();
                    console.error('Failed to get workflow metrics:', error_3);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getWorkflowMetrics = getWorkflowMetrics;
function getStepMetrics(step, start_date, end_date) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseAdmin, data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supabaseAdmin = (0, supabase_admin_1.getSupabaseAdmin)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabaseAdmin
                            .rpc('get_step_metrics', {
                            p_step: step,
                            p_start_date: start_date,
                            p_end_date: end_date
                        })];
                case 2:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
                case 3:
                    error_4 = _a.sent();
                    console.error('Failed to get step metrics:', error_4);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getStepMetrics = getStepMetrics;
function detectAnomalies() {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseAdmin, stuckWorkflows, metrics, slowSteps, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supabaseAdmin = (0, supabase_admin_1.getSupabaseAdmin)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, supabaseAdmin
                            .from('newsletter_workflows')
                            .select('*')
                            .eq('step_status', 'in_progress')
                            .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())];
                case 2:
                    stuckWorkflows = (_a.sent()).data;
                    if (stuckWorkflows === null || stuckWorkflows === void 0 ? void 0 : stuckWorkflows.length) {
                        console.error("Found ".concat(stuckWorkflows.length, " stuck workflows"));
                        // Could add notification logic here
                    }
                    return [4 /*yield*/, getWorkflowMetrics()];
                case 3:
                    metrics = _a.sent();
                    if (metrics.error_rate > 0.1) { // 10% error rate threshold
                        console.error("High workflow error rate detected: ".concat(metrics.error_rate * 100, "%"));
                        // Could add notification logic here
                    }
                    return [4 /*yield*/, supabaseAdmin
                            .from('workflow_monitoring')
                            .select('step, duration_ms')
                            .gt('duration_ms', 60000) // 1 minute
                            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())];
                case 4:
                    slowSteps = (_a.sent()).data;
                    if (slowSteps === null || slowSteps === void 0 ? void 0 : slowSteps.length) {
                        console.warn("Found ".concat(slowSteps.length, " slow workflow steps"));
                        // Could add notification logic here
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _a.sent();
                    console.error('Failed to detect anomalies:', error_5);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.detectAnomalies = detectAnomalies;
// Enhanced error logging for workflows
function logWorkflowError(error, context) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseAdmin, loggingError_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supabaseAdmin = (0, supabase_admin_1.getSupabaseAdmin)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    // Log to workflow_errors table
                    return [4 /*yield*/, supabaseAdmin
                            .from('workflow_errors')
                            .insert([{
                                workflow_id: context.workflow_id,
                                newsletter_id: context.newsletter_id,
                                step: context.step,
                                error_message: error.message,
                                error_type: error.name,
                                stack_trace: error.stack,
                                metadata: __assign(__assign({}, context.metadata), { timestamp: new Date().toISOString() })
                            }])];
                case 2:
                    // Log to workflow_errors table
                    _a.sent();
                    // Log workflow event
                    return [4 /*yield*/, logWorkflowEvent({
                            workflow_id: context.workflow_id,
                            newsletter_id: context.newsletter_id,
                            event_type: 'step_failed',
                            step: context.step,
                            error_message: error.message,
                            metadata: context.metadata
                        })];
                case 3:
                    // Log workflow event
                    _a.sent();
                    // Console logging for development
                    console.error('Workflow Error:', {
                        workflow_id: context.workflow_id,
                        step: context.step,
                        error: error.message,
                        metadata: context.metadata
                    });
                    return [3 /*break*/, 5];
                case 4:
                    loggingError_2 = _a.sent();
                    console.error('Failed to log workflow error:', loggingError_2);
                    console.error('Original error:', error);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.logWorkflowError = logWorkflowError;

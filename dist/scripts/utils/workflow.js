"use strict";
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
exports.isStepComplete = exports.advanceWorkflow = exports.updateWorkflowStatus = exports.initializeWorkflow = exports.WORKFLOW_STEPS = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
exports.WORKFLOW_STEPS = {
    INIT: {
        name: 'initialize',
        next: 'WELCOME_SECTION',
        validates: function (newsletterId) { return __awaiter(void 0, void 0, void 0, function () {
            var newsletter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, supabase
                            .from('newsletters')
                            .select('status, draft_status')
                            .eq('id', newsletterId)
                            .single()];
                    case 1:
                        newsletter = (_a.sent()).data;
                        return [2 /*return*/, (newsletter === null || newsletter === void 0 ? void 0 : newsletter.status) === 'draft' && (newsletter === null || newsletter === void 0 ? void 0 : newsletter.draft_status) === 'draft'];
                }
            });
        }); }
    },
    WELCOME_SECTION: {
        name: 'welcome_section',
        next: 'TRENDS_SECTION',
        validates: function (newsletterId) { return __awaiter(void 0, void 0, void 0, function () {
            var workflow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, supabase
                            .from('newsletter_workflows')
                            .select('current_step, step_status')
                            .eq('newsletter_id', newsletterId)
                            .single()];
                    case 1:
                        workflow = (_a.sent()).data;
                        return [2 /*return*/, (workflow === null || workflow === void 0 ? void 0 : workflow.current_step) === 'WELCOME_SECTION'];
                }
            });
        }); },
        queueItems: [
            { type: 'welcome', section_number: 1 }
        ]
    },
    TRENDS_SECTION: {
        name: 'trends_section',
        next: 'TIPS_SECTION',
        validates: function (newsletterId) { return __awaiter(void 0, void 0, void 0, function () {
            var sections;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, supabase
                            .from('newsletter_sections')
                            .select('status')
                            .eq('newsletter_id', newsletterId)
                            .eq('section_type', 'welcome')];
                    case 1:
                        sections = (_b.sent()).data;
                        return [2 /*return*/, ((_a = sections === null || sections === void 0 ? void 0 : sections[0]) === null || _a === void 0 ? void 0 : _a.status) === 'completed'];
                }
            });
        }); },
        queueItems: [
            { type: 'industry_trends', section_number: 2 }
        ]
    },
    TIPS_SECTION: {
        name: 'tips_section',
        next: 'COMPILE',
        validates: function (newsletterId) { return __awaiter(void 0, void 0, void 0, function () {
            var sections;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, supabase
                            .from('newsletter_sections')
                            .select('status')
                            .eq('newsletter_id', newsletterId)
                            .eq('section_type', 'industry_trends')];
                    case 1:
                        sections = (_b.sent()).data;
                        return [2 /*return*/, ((_a = sections === null || sections === void 0 ? void 0 : sections[0]) === null || _a === void 0 ? void 0 : _a.status) === 'completed'];
                }
            });
        }); },
        queueItems: [
            { type: 'practical_tips', section_number: 3 }
        ]
    },
    COMPILE: {
        name: 'compile',
        next: 'SEND_DRAFT',
        validates: function (newsletterId) { return __awaiter(void 0, void 0, void 0, function () {
            var sections;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, supabase
                            .from('newsletter_sections')
                            .select('status')
                            .eq('newsletter_id', newsletterId)];
                    case 1:
                        sections = (_b.sent()).data;
                        return [2 /*return*/, (_a = sections === null || sections === void 0 ? void 0 : sections.every(function (s) { return s.status === 'completed'; })) !== null && _a !== void 0 ? _a : false];
                }
            });
        }); }
    },
    SEND_DRAFT: {
        name: 'send_draft',
        next: 'COMPLETE',
        validates: function (newsletterId) { return __awaiter(void 0, void 0, void 0, function () {
            var newsletter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, supabase
                            .from('newsletters')
                            .select('draft_status')
                            .eq('id', newsletterId)
                            .single()];
                    case 1:
                        newsletter = (_a.sent()).data;
                        return [2 /*return*/, (newsletter === null || newsletter === void 0 ? void 0 : newsletter.draft_status) === 'ready_to_send'];
                }
            });
        }); }
    },
    COMPLETE: {
        name: 'complete',
        next: null,
        validates: function (newsletterId) { return __awaiter(void 0, void 0, void 0, function () {
            var newsletter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, supabase
                            .from('newsletters')
                            .select('draft_status')
                            .eq('id', newsletterId)
                            .single()];
                    case 1:
                        newsletter = (_a.sent()).data;
                        return [2 /*return*/, (newsletter === null || newsletter === void 0 ? void 0 : newsletter.draft_status) === 'draft_sent'];
                }
            });
        }); }
    }
};
function initializeWorkflow(newsletterId) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, _a, workflow, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('newsletter_workflows')
                        .select('*')
                        .eq('newsletter_id', newsletterId)
                        .single()];
                case 1:
                    existing = (_b.sent()).data;
                    if (existing) {
                        throw new Error('Workflow already exists for this newsletter');
                    }
                    return [4 /*yield*/, supabase
                            .from('newsletter_workflows')
                            .insert({
                            newsletter_id: newsletterId,
                            current_step: 'INIT',
                            step_status: 'pending'
                        })
                            .select()
                            .single()];
                case 2:
                    _a = _b.sent(), workflow = _a.data, error = _a.error;
                    if (error || !workflow) {
                        throw new Error('Failed to initialize workflow');
                    }
                    return [2 /*return*/, workflow];
            }
        });
    });
}
exports.initializeWorkflow = initializeWorkflow;
function updateWorkflowStatus(workflowId, status, error) {
    return __awaiter(this, void 0, void 0, function () {
        var updates, _a, workflow, updateError;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    updates = {
                        step_status: status,
                        updated_at: new Date().toISOString()
                    };
                    if (error) {
                        updates.error_message = error.message;
                        updates.attempts = supabase.rpc('increment_attempts', { workflow_id: workflowId });
                    }
                    return [4 /*yield*/, supabase
                            .from('newsletter_workflows')
                            .update(updates)
                            .eq('id', workflowId)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), workflow = _a.data, updateError = _a.error;
                    if (updateError || !workflow) {
                        throw new Error('Failed to update workflow status');
                    }
                    return [2 /*return*/, workflow];
            }
        });
    });
}
exports.updateWorkflowStatus = updateWorkflowStatus;
function advanceWorkflow(workflowId) {
    return __awaiter(this, void 0, void 0, function () {
        var workflow, currentStep, _a, updated, error, nextStep, _i, _b, item;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('newsletter_workflows')
                        .select('*')
                        .eq('id', workflowId)
                        .single()];
                case 1:
                    workflow = (_c.sent()).data;
                    if (!workflow) {
                        throw new Error('Workflow not found');
                    }
                    currentStep = exports.WORKFLOW_STEPS[workflow.current_step];
                    if (!currentStep.next) {
                        // Workflow is complete
                        return [2 /*return*/, workflow];
                    }
                    return [4 /*yield*/, supabase
                            .from('newsletter_workflows')
                            .update({
                            current_step: currentStep.next,
                            step_status: 'pending',
                            attempts: 0,
                            error_message: null,
                            step_data: null
                        })
                            .eq('id', workflowId)
                            .select()
                            .single()];
                case 2:
                    _a = _c.sent(), updated = _a.data, error = _a.error;
                    if (error || !updated) {
                        throw new Error('Failed to advance workflow');
                    }
                    nextStep = exports.WORKFLOW_STEPS[currentStep.next];
                    if (!nextStep.queueItems) return [3 /*break*/, 6];
                    _i = 0, _b = nextStep.queueItems;
                    _c.label = 3;
                case 3:
                    if (!(_i < _b.length)) return [3 /*break*/, 6];
                    item = _b[_i];
                    return [4 /*yield*/, supabase
                            .from('newsletter_generation_queue')
                            .insert({
                            newsletter_id: workflow.newsletter_id,
                            section_type: item.type,
                            section_number: item.section_number,
                            status: 'pending'
                        })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, updated];
            }
        });
    });
}
exports.advanceWorkflow = advanceWorkflow;
function isStepComplete(workflow) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var step, queueItems;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    step = exports.WORKFLOW_STEPS[workflow.current_step];
                    if (workflow.step_status !== 'completed') {
                        return [2 /*return*/, false];
                    }
                    if (!step.queueItems) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase
                            .from('newsletter_generation_queue')
                            .select('status')
                            .eq('newsletter_id', workflow.newsletter_id)
                            .in('section_type', step.queueItems.map(function (i) { return i.type; }))];
                case 1:
                    queueItems = (_b.sent()).data;
                    return [2 /*return*/, (_a = queueItems === null || queueItems === void 0 ? void 0 : queueItems.every(function (item) { return item.status === 'completed'; })) !== null && _a !== void 0 ? _a : false];
                case 2: 
                // For other steps, trust the workflow status
                return [2 /*return*/, true];
            }
        });
    });
}
exports.isStepComplete = isStepComplete;

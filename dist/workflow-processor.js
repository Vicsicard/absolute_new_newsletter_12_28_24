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
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = require("dotenv");
var openai_1 = require("openai");
// Load environment variables
dotenv.config({ path: '.env.local' });
// Initialize clients
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
var openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
// Workflow step definitions
var WORKFLOW_STEPS = {
    NEWSLETTER_INIT: {
        name: 'newsletter_init',
        table: 'newsletters',
        handler: handleNewsletterInit,
        next_steps: ['QUEUE_GENERATION'],
        required_status: 'draft'
    },
    QUEUE_GENERATION: {
        name: 'queue_generation',
        table: 'newsletter_generation_queue',
        handler: handleQueueGeneration,
        next_steps: ['SECTION_1_GEN'],
        required_status: 'pending'
    },
    SECTION_1_GEN: {
        name: 'section_1_gen',
        table: 'newsletter_sections',
        handler: handleSectionGeneration,
        next_steps: ['SECTION_2_GEN'],
        required_status: 'pending',
        section_number: 1
    },
    SECTION_2_GEN: {
        name: 'section_2_gen',
        table: 'newsletter_sections',
        handler: handleSectionGeneration,
        next_steps: ['SECTION_3_GEN'],
        required_status: 'pending',
        section_number: 2
    },
    SECTION_3_GEN: {
        name: 'section_3_gen',
        table: 'newsletter_sections',
        handler: handleSectionGeneration,
        next_steps: ['NEWSLETTER_COMPILE'],
        required_status: 'pending',
        section_number: 3
    },
    NEWSLETTER_COMPILE: {
        name: 'newsletter_compile',
        table: 'compiled_newsletters',
        handler: handleNewsletterCompile,
        next_steps: ['DRAFT_REVIEW'],
        required_status: 'pending'
    },
    DRAFT_REVIEW: {
        name: 'draft_review',
        table: 'newsletters',
        handler: handleDraftReview,
        next_steps: ['AWAIT_APPROVAL'],
        required_status: 'ready_to_send'
    },
    AWAIT_APPROVAL: {
        name: 'await_approval',
        table: 'newsletters',
        handler: handleAwaitApproval,
        next_steps: ['FINAL_SEND'],
        required_status: 'draft_sent'
    },
    FINAL_SEND: {
        name: 'final_send',
        table: 'newsletters',
        handler: handleFinalSend,
        next_steps: [],
        required_status: 'pending_contacts'
    }
};
// Handler functions for each step
function handleNewsletterInit(process) {
    return __awaiter(this, void 0, void 0, function () {
        var newsletter, sections, _i, sections_1, section;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('newsletters')
                        .select('*')
                        .eq('id', process.newsletter_id)
                        .single()];
                case 1:
                    newsletter = (_a.sent()).data;
                    if (!newsletter) {
                        throw new Error('Newsletter not found');
                    }
                    sections = [
                        { type: 'welcome', number: 1 },
                        { type: 'industry_trends', number: 2 },
                        { type: 'practical_tips', number: 3 }
                    ];
                    _i = 0, sections_1 = sections;
                    _a.label = 2;
                case 2:
                    if (!(_i < sections_1.length)) return [3 /*break*/, 5];
                    section = sections_1[_i];
                    return [4 /*yield*/, supabase
                            .from('newsletter_sections')
                            .upsert({
                            newsletter_id: process.newsletter_id,
                            section_type: section.type,
                            section_number: section.number,
                            status: 'pending'
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, true];
            }
        });
    });
}
function handleQueueGeneration(process) {
    return __awaiter(this, void 0, void 0, function () {
        var sections, _i, sections_2, section;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('newsletter_sections')
                        .select('*')
                        .eq('newsletter_id', process.newsletter_id)];
                case 1:
                    sections = (_a.sent()).data;
                    if (!sections) {
                        throw new Error('No sections found');
                    }
                    _i = 0, sections_2 = sections;
                    _a.label = 2;
                case 2:
                    if (!(_i < sections_2.length)) return [3 /*break*/, 5];
                    section = sections_2[_i];
                    return [4 /*yield*/, supabase
                            .from('newsletter_generation_queue')
                            .upsert({
                            newsletter_id: process.newsletter_id,
                            section_type: section.section_type,
                            section_number: section.section_number,
                            status: 'pending'
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, true];
            }
        });
    });
}
function handleSectionGeneration(process) {
    return __awaiter(this, void 0, void 0, function () {
        var step, queueItem;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    step = WORKFLOW_STEPS[process.current_step];
                    return [4 /*yield*/, supabase
                            .from('newsletter_generation_queue')
                            .select('*')
                            .eq('newsletter_id', process.newsletter_id)
                            .eq('section_number', step.section_number)
                            .single()];
                case 1:
                    queueItem = (_a.sent()).data;
                    if (!queueItem) {
                        throw new Error('Queue item not found');
                    }
                    // Process the section using OpenAI
                    // ... (existing OpenAI processing logic)
                    return [2 /*return*/, true];
            }
        });
    });
}
function handleNewsletterCompile(process) {
    return __awaiter(this, void 0, void 0, function () {
        var sections, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('newsletter_sections')
                        .select('*')
                        .eq('newsletter_id', process.newsletter_id)
                        .eq('status', 'completed')
                        .order('section_number')];
                case 1:
                    sections = (_a.sent()).data;
                    if (!sections || sections.length !== 3) {
                        throw new Error('Not all sections are completed');
                    }
                    html = sections.map(function (section) { return "\n    <h2>".concat(section.title, "</h2>\n    <div>").concat(section.content, "</div>\n  "); }).join('\n');
                    // Create compiled newsletter
                    return [4 /*yield*/, supabase
                            .from('compiled_newsletters')
                            .upsert({
                            newsletter_id: process.newsletter_id,
                            html_content: html,
                            compiled_status: 'completed'
                        })];
                case 2:
                    // Create compiled newsletter
                    _a.sent();
                    // Update newsletter status
                    return [4 /*yield*/, supabase
                            .from('newsletters')
                            .update({ draft_status: 'ready_to_send' })
                            .eq('id', process.newsletter_id)];
                case 3:
                    // Update newsletter status
                    _a.sent();
                    return [2 /*return*/, true];
            }
        });
    });
}
function handleDraftReview(process) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Send draft email logic here
                // ... (implement draft email sending)
                // Update newsletter status
                return [4 /*yield*/, supabase
                        .from('newsletters')
                        .update({ draft_status: 'draft_sent' })
                        .eq('id', process.newsletter_id)];
                case 1:
                    // Send draft email logic here
                    // ... (implement draft email sending)
                    // Update newsletter status
                    _a.sent();
                    return [2 /*return*/, true];
            }
        });
    });
}
function handleAwaitApproval(process) {
    return __awaiter(this, void 0, void 0, function () {
        var newsletter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('newsletters')
                        .select('draft_status')
                        .eq('id', process.newsletter_id)
                        .single()];
                case 1:
                    newsletter = (_a.sent()).data;
                    if ((newsletter === null || newsletter === void 0 ? void 0 : newsletter.draft_status) === 'pending_contacts') {
                        return [2 /*return*/, true];
                    }
                    return [2 /*return*/, false]; // Still waiting for approval
            }
        });
    });
}
function handleFinalSend(process) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Send to all contacts logic here
                // ... (implement final email sending)
                // Update newsletter status
                return [4 /*yield*/, supabase
                        .from('newsletters')
                        .update({
                        status: 'published',
                        draft_status: 'sent'
                    })
                        .eq('id', process.newsletter_id)];
                case 1:
                    // Send to all contacts logic here
                    // ... (implement final email sending)
                    // Update newsletter status
                    _a.sent();
                    return [2 /*return*/, true];
            }
        });
    });
}
// Main workflow processor
function processWorkflow() {
    return __awaiter(this, void 0, void 0, function () {
        var processes, _i, processes_1, process_1, step, success, updates, nextStep, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 23];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 20, , 22]);
                    return [4 /*yield*/, supabase
                            .from('workflow_processes')
                            .select('*')
                            .in('step_status', ['pending', 'in_progress'])
                            .order('created_at')];
                case 2:
                    processes = (_a.sent()).data;
                    if (!(!processes || processes.length === 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 4:
                    _i = 0, processes_1 = processes;
                    _a.label = 5;
                case 5:
                    if (!(_i < processes_1.length)) return [3 /*break*/, 19];
                    process_1 = processes_1[_i];
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 15, , 18]);
                    step = WORKFLOW_STEPS[process_1.current_step];
                    // Update process to in_progress
                    return [4 /*yield*/, supabase
                            .from('workflow_processes')
                            .update({
                            step_status: 'in_progress',
                            started_at: new Date().toISOString()
                        })
                            .eq('id', process_1.id)];
                case 7:
                    // Update process to in_progress
                    _a.sent();
                    // Log step start
                    return [4 /*yield*/, supabase
                            .from('workflow_step_logs')
                            .insert({
                            process_id: process_1.id,
                            step_name: step.name,
                            status: 'in_progress'
                        })];
                case 8:
                    // Log step start
                    _a.sent();
                    return [4 /*yield*/, step.handler(process_1)];
                case 9:
                    success = _a.sent();
                    if (!success) return [3 /*break*/, 14];
                    updates = {
                        step_status: 'completed',
                        completed_at: new Date().toISOString()
                    };
                    if (!(step.next_steps.length > 0)) return [3 /*break*/, 11];
                    nextStep = step.next_steps[0];
                    return [4 /*yield*/, supabase
                            .from('workflow_processes')
                            .insert({
                            newsletter_id: process_1.newsletter_id,
                            current_step: nextStep,
                            step_status: 'pending'
                        })];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11: 
                // Update current process
                return [4 /*yield*/, supabase
                        .from('workflow_processes')
                        .update(updates)
                        .eq('id', process_1.id)];
                case 12:
                    // Update current process
                    _a.sent();
                    // Log step completion
                    return [4 /*yield*/, supabase
                            .from('workflow_step_logs')
                            .insert({
                            process_id: process_1.id,
                            step_name: step.name,
                            status: 'completed',
                            completed_at: new Date().toISOString()
                        })];
                case 13:
                    // Log step completion
                    _a.sent();
                    _a.label = 14;
                case 14: return [3 /*break*/, 18];
                case 15:
                    error_1 = _a.sent();
                    console.error("Error processing step ".concat(process_1.current_step, ":"), error_1);
                    // Update process status
                    return [4 /*yield*/, supabase
                            .from('workflow_processes')
                            .update({
                            step_status: 'failed',
                            error_message: error_1.message
                        })
                            .eq('id', process_1.id)];
                case 16:
                    // Update process status
                    _a.sent();
                    // Log step failure
                    return [4 /*yield*/, supabase
                            .from('workflow_step_logs')
                            .insert({
                            process_id: process_1.id,
                            step_name: WORKFLOW_STEPS[process_1.current_step].name,
                            status: 'failed',
                            error_message: error_1.message
                        })];
                case 17:
                    // Log step failure
                    _a.sent();
                    return [3 /*break*/, 18];
                case 18:
                    _i++;
                    return [3 /*break*/, 5];
                case 19: return [3 /*break*/, 22];
                case 20:
                    error_2 = _a.sent();
                    console.error('Error in workflow processor:', error_2);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 21:
                    _a.sent();
                    return [3 /*break*/, 22];
                case 22: return [3 /*break*/, 0];
                case 23: return [2 /*return*/];
            }
        });
    });
}
// Start the workflow processor
console.log('Starting workflow processor...');
processWorkflow().catch(function (error) {
    console.error('Fatal error in workflow processor:', error);
    process.exit(1);
});

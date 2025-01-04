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
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var supabase_js_1 = require("@supabase/supabase-js");
var workflow_1 = require("../utils/workflow");
var monitoring_1 = require("../utils/monitoring");
// Load environment variables
dotenv_1.default.config({ path: (0, path_1.join)(process.cwd(), '.env.local') });
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
function createTestNewsletter(companyId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, newsletter, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('newsletters')
                        .insert({
                        company_id: companyId,
                        status: 'draft',
                        draft_status: 'draft',
                        title: "Test Newsletter ".concat(new Date().toISOString()),
                        description: 'Test newsletter for workflow validation'
                    })
                        .select()
                        .single()];
                case 1:
                    _a = _b.sent(), newsletter = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, newsletter];
            }
        });
    });
}
function createTestCompany() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, company, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('companies')
                        .insert({
                        company_name: "Test Company ".concat(new Date().toISOString()),
                        industry: 'Technology',
                        target_audience: 'Developers',
                        audience_description: 'Software developers and engineers',
                        contact_email: 'test@example.com'
                    })
                        .select()
                        .single()];
                case 1:
                    _a = _b.sent(), company = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, company];
            }
        });
    });
}
function simulateWorkflow() {
    return __awaiter(this, void 0, void 0, function () {
        var company, newsletter, workflow, sections, _i, sections_1, section, error, metrics, stepMetrics, errors, finalWorkflow, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Starting workflow simulation...\n');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 14, , 15]);
                    // Create test company and newsletter
                    console.log('Creating test company...');
                    return [4 /*yield*/, createTestCompany()];
                case 2:
                    company = _a.sent();
                    console.log('Company created:', company.company_name);
                    console.log('\nCreating test newsletter...');
                    return [4 /*yield*/, createTestNewsletter(company.id)];
                case 3:
                    newsletter = _a.sent();
                    console.log('Newsletter created:', newsletter.title);
                    // Initialize workflow
                    console.log('\nInitializing workflow...');
                    return [4 /*yield*/, (0, workflow_1.initializeWorkflow)(newsletter.id)];
                case 4:
                    workflow = _a.sent();
                    console.log('Workflow initialized:', workflow.id);
                    // Create queue items for testing
                    console.log('\nCreating test queue items...');
                    sections = [
                        { type: 'welcome', section_number: 1 },
                        { type: 'industry_trends', section_number: 2 },
                        { type: 'practical_tips', section_number: 3 }
                    ];
                    _i = 0, sections_1 = sections;
                    _a.label = 5;
                case 5:
                    if (!(_i < sections_1.length)) return [3 /*break*/, 8];
                    section = sections_1[_i];
                    return [4 /*yield*/, supabase
                            .from('newsletter_generation_queue')
                            .insert({
                            newsletter_id: newsletter.id,
                            section_type: section.type,
                            section_number: section.section_number,
                            status: 'pending'
                        })];
                case 6:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    console.log("Queue item created for ".concat(section.type));
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    // Start the queue processor
                    console.log('\nStarting queue processor...');
                    console.log('Check the queue processor logs for processing details.');
                    // Wait for processing to complete (in real scenario, this would be event-driven)
                    console.log('\nWaiting for processing to complete...');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 30000); })];
                case 9:
                    _a.sent(); // Wait 30 seconds
                    // Get workflow metrics
                    console.log('\nFetching workflow metrics...');
                    return [4 /*yield*/, (0, monitoring_1.getWorkflowMetrics)()];
                case 10:
                    metrics = _a.sent();
                    console.log('Workflow Metrics:', JSON.stringify(metrics, null, 2));
                    // Get step metrics
                    console.log('\nFetching step metrics...');
                    return [4 /*yield*/, (0, monitoring_1.getStepMetrics)()];
                case 11:
                    stepMetrics = _a.sent();
                    console.log('Step Metrics:', JSON.stringify(stepMetrics, null, 2));
                    // Check for any errors
                    console.log('\nChecking for errors...');
                    return [4 /*yield*/, supabase
                            .from('workflow_errors')
                            .select('*')
                            .eq('newsletter_id', newsletter.id)];
                case 12:
                    errors = (_a.sent()).data;
                    if (errors && errors.length > 0) {
                        console.log('Errors found:', errors);
                    }
                    else {
                        console.log('No errors found');
                    }
                    return [4 /*yield*/, supabase
                            .from('newsletter_workflows')
                            .select('*')
                            .eq('id', workflow.id)
                            .single()];
                case 13:
                    finalWorkflow = (_a.sent()).data;
                    console.log('\nFinal workflow state:', finalWorkflow);
                    return [3 /*break*/, 15];
                case 14:
                    error_1 = _a.sent();
                    console.error('Simulation failed:', error_1);
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// Run the simulation
simulateWorkflow();

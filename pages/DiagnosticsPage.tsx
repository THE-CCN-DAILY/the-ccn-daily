import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { SpinnerIcon, CheckIcon, XMarkIcon, SparklesIcon } from '../components/icons/index';

import { GoogleGenAI } from "@google/genai";
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const DiagnosticsPage: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [testingAi, setTestingAi] = useState(false);
    const [aiTestResult, setAiTestResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const checkSystem = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/ai/diagnostics');
            if (!response.ok) throw new Error('Failed to fetch diagnostics');
            const data = await response.json();
            
            // Check if user has selected an API key via AI Studio
            if (window.aistudio) {
                data.hasSelectedApiKey = await window.aistudio.hasSelectedApiKey();
            }
            
            // Check Firestore from the frontend
            try {
                await getDoc(doc(db, '_system_health', 'check'));
                data.firestore = 'connected';
            } catch (fsError: any) {
                if (fsError.message?.includes('offline')) {
                    data.firestore = 'failed';
                    data.error_firestore = 'Client is offline. Check Firebase config.';
                } else {
                    // Permission denied still means we connected to Firestore
                    data.firestore = 'connected';
                }
            }
            
            setStatus(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const runAiTest = async () => {
        setTestingAi(true);
        setAiTestResult(null);
        try {
            const platformKey = process.env.GEMINI_API_KEY;
            const userKey = process.env.API_KEY;
            const isPlatformKeyValid = !!(platformKey && platformKey.startsWith('AIza') && platformKey !== 'undefined');
            const apiKey = isPlatformKeyValid ? platformKey : userKey;

            const ai = new GoogleGenAI({ apiKey: apiKey || "" });
            const model = 'gemini-3-flash-preview';

            const response = await ai.models.generateContent({
                model: model,
                contents: 'System check: respond with "OK"',
            });

            if (response.text?.includes('OK')) {
                setAiTestResult({
                    status: 'connected',
                    response: response.text,
                    timestamp: new Date().toISOString()
                });
            } else {
                setAiTestResult({
                    status: 'unexpected response',
                    response: response.text || 'No response',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (err: any) {
            console.error('[AI Diagnostic Test Error]:', err);
            setAiTestResult({
                status: 'failed',
                error: err.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setTestingAi(false);
        }
    };

    useEffect(() => {
        checkSystem();
    }, []);

    const StatusItem = ({ label, value, errorMsg }: { label: string, value: string, errorMsg?: string }) => (
        <div className="flex items-center justify-between p-4 bg-brand-accent/5 rounded-lg border border-brand-accent/10">
            <div>
                <p className="text-sm font-semibold text-brand-text-secondary">{label}</p>
                <p className={`text-lg font-bold ${value === 'connected' || value === 'active' ? 'text-status-success' : 'text-status-error'}`}>
                    {value.toUpperCase()}
                </p>
                {errorMsg && <p className="text-xs text-red-400 mt-1">{errorMsg}</p>}
            </div>
            {value === 'connected' || value === 'active' ? (
                <CheckIcon className="w-8 h-8 text-status-success" />
            ) : (
                <XMarkIcon className="w-8 h-8 text-status-error" />
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">System Diagnostics</h1>
            <p className="text-brand-text-secondary mb-8">Verifying the Enterprise AI Triad connectivity.</p>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <SpinnerIcon className="w-12 h-12 text-brand-accent mb-4" />
                    <p className="text-brand-text-secondary">Pinging the System...</p>
                </div>
            ) : error ? (
                <Card>
                    <div className="text-center py-8">
                        <XMarkIcon className="w-12 h-12 text-status-error mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-brand-text-primary">Connection Failed</h3>
                        <p className="text-brand-text-secondary mb-6">{error}</p>
                        <button onClick={checkSystem} className="px-6 py-2 bg-brand-accent text-white rounded-lg">Retry Check</button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatusItem label="Firestore Client" value={status.firestore} errorMsg={status.error_firestore} />
                    <StatusItem 
                        label="Gemini Engine" 
                        value={aiTestResult?.status || 'awaiting test'} 
                        errorMsg={aiTestResult?.error} 
                    />
                    <StatusItem label="System Health" value={status.firestore === 'connected' ? 'active' : 'error'} />
                    
                    <div className="md:col-span-3 mt-8">
                        <Card>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-lg font-bold text-brand-text-primary">Enterprise Optimization</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">API Key Source</span>
                                            <span className="font-mono text-brand-accent font-bold">{status.apiKeySource}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">Platform Key</span>
                                            <span className={status.hasGeminiApiKey ? 'text-status-success font-bold' : 'text-brand-text-secondary'}>
                                                {status.hasGeminiApiKey ? 'DETECTED' : 'MISSING'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">User Key</span>
                                            <span className={status.hasUserApiKey ? 'text-status-success font-bold' : 'text-brand-text-secondary'}>
                                                {status.hasUserApiKey ? 'DETECTED' : 'MISSING'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">Custom Key Selected</span>
                                            <span className={status.hasSelectedApiKey ? 'text-status-success font-bold' : 'text-brand-text-secondary'}>
                                                {status.hasSelectedApiKey ? 'YES' : 'NO'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">Test Model</span>
                                            <span className="text-brand-accent font-bold">GEMINI-3-FLASH-PREVIEW</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">Mode</span>
                                            <span className="text-brand-accent font-bold">COST-SAVING</span>
                                        </div>
                                    </div>
                                    
                                    {/* API Key Selection for Enterprise/Pro features */}
                                    <div className="mt-4 p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-lg">
                                        <p className="text-xs text-brand-text-secondary mb-2">
                                            If you are experiencing RPC errors (500) with the platform key, please select your own paid Google Cloud API key.
                                        </p>
                                        <button 
                                            onClick={async () => {
                                                if (window.aistudio) {
                                                    await window.aistudio.openSelectKey();
                                                    checkSystem();
                                                } else {
                                                    alert("API Key selection is only available in the AI Studio environment.");
                                                }
                                            }}
                                            className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
                                        >
                                            <SparklesIcon className="w-3 h-3" /> Select Custom API Key
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    <button 
                                        onClick={runAiTest} 
                                        disabled={testingAi}
                                        className="px-6 py-3 bg-brand-accent text-white rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {testingAi ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                        {testingAi ? 'Testing...' : 'Run AI Connectivity Test'}
                                    </button>
                                    <button 
                                        onClick={checkSystem} 
                                        className="px-6 py-3 border border-brand-border text-brand-text-secondary rounded-lg hover:bg-brand-secondary transition-all"
                                    >
                                        Refresh System Status
                                    </button>
                                </div>
                            </div>
                            
                            {aiTestResult && (
                                <div className={`mt-6 p-4 rounded-lg border ${aiTestResult.status === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-1">Test Result</p>
                                    <p className="text-sm">{aiTestResult.status === 'connected' ? 'Success: Gemini is responding correctly.' : `Error: ${aiTestResult.error}`}</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosticsPage;

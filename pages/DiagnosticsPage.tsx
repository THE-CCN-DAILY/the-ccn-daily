import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Activity } from 'lucide-react';
import { SpinnerIcon, CheckIcon, XMarkIcon } from '../components/icons/index';

const DiagnosticsPage: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [testingBackgroundServices, setTestingBackgroundServices] = useState(false);
    const [backgroundTestResult, setBackgroundTestResult] = useState<any>(null);
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

            setStatus(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const runBackgroundServiceTest = async () => {
        setTestingBackgroundServices(true);
        setBackgroundTestResult(null);
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feature: 'diagnostics',
                    prompt: 'System check: respond with OK',
                    model: status?.model || '@cf/meta/llama-3.1-8b-instruct',
                }),
            });
            if (!response.ok) throw new Error(`Background service route failed (${response.status})`);
            const data = await response.json();

            setBackgroundTestResult({
                status: data.fallback ? 'fallback' : 'connected',
                response: data.text || 'No response',
                timestamp: new Date().toISOString()
            });
        } catch (err: any) {
            setBackgroundTestResult({
                status: 'failed',
                error: err.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setTestingBackgroundServices(false);
        }
    };

    useEffect(() => {
        checkSystem();
    }, []);

    const StatusItem = ({ label, value, errorMsg }: { label: string, value: string, errorMsg?: string }) => (
        <div className="flex items-center justify-between p-4 bg-brand-accent/5 rounded-lg border border-brand-accent/10">
            <div>
                <p className="text-sm font-semibold text-brand-text-secondary">{label}</p>
                <p className={`text-lg font-bold ${value === 'connected' || value === 'active' || value === 'fallback' ? 'text-status-success' : 'text-status-error'}`}>
                    {value.toUpperCase()}
                </p>
                {errorMsg && <p className="text-xs text-red-400 mt-1">{errorMsg}</p>}
            </div>
            {value === 'connected' || value === 'active' || value === 'fallback' ? (
                <CheckIcon className="w-8 h-8 text-status-success" />
            ) : (
                <XMarkIcon className="w-8 h-8 text-status-error" />
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">System Diagnostics</h1>
            <p className="text-brand-text-secondary mb-8">Verifying Cloudflare Pages, D1, and background service readiness.</p>

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
                    <StatusItem label="Cloudflare D1" value={status.database} />
                    <StatusItem 
                        label="Background Services"
                        value={backgroundTestResult?.status || 'awaiting test'}
                        errorMsg={backgroundTestResult?.error}
                    />
                    <StatusItem label="Pages Runtime" value={status.cloudflarePages === 'connected' ? 'active' : 'error'} />
                    
                    <div className="md:col-span-3 mt-8">
                        <Card>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-lg font-bold text-brand-text-primary">Enterprise Optimization</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">Service Source</span>
                                            <span className="font-mono text-brand-accent font-bold">{status.apiKeySource}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">D1 Binding</span>
                                            <span className={status.database === 'connected' ? 'text-status-success font-bold' : 'text-brand-text-secondary'}>
                                                {status.database === 'connected' ? 'CONNECTED' : 'MISSING'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">Background Services</span>
                                            <span className={status.workersAi === 'connected' ? 'text-status-success font-bold' : 'text-brand-text-secondary'}>
                                                {status.workersAi === 'connected' ? 'BOUND' : 'LOCAL FALLBACK'}
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
                                            <span className="text-brand-accent font-bold">{status.model}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-2 bg-brand-secondary rounded">
                                            <span className="text-brand-text-secondary">Mode</span>
                                            <span className="text-brand-accent font-bold">COST-SAVING</span>
                                        </div>
                                    </div>
                                    
                                    {/* Cloudflare AI binding note */}
                                    <div className="mt-4 p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-lg">
                                        <p className="text-xs text-brand-text-secondary mb-2">
                                            Local preview can use fallback output. Production should bind Cloudflare background services before enabling paid premium workflows.
                                        </p>
                                        <p className="text-xs font-bold text-brand-accent flex items-center gap-1">
                                            <Activity className="w-3 h-3" /> Cloudflare-native background path active
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    <button 
                                        onClick={runBackgroundServiceTest}
                                        disabled={testingBackgroundServices}
                                        className="px-6 py-3 bg-brand-accent text-white rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {testingBackgroundServices ? <SpinnerIcon className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                        {testingBackgroundServices ? 'Testing...' : 'Run Background Service Test'}
                                    </button>
                                    <button 
                                        onClick={checkSystem} 
                                        className="px-6 py-3 border border-brand-border text-brand-text-secondary rounded-lg hover:bg-brand-secondary transition-all"
                                    >
                                        Refresh System Status
                                    </button>
                                </div>
                            </div>
                            
                            {backgroundTestResult && (
                                <div className={`mt-6 p-4 rounded-lg border ${backgroundTestResult.status === 'connected' || backgroundTestResult.status === 'fallback' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-1">Test Result</p>
                                    <p className="text-sm">
                                        {backgroundTestResult.status === 'connected'
                                            ? 'Success: background service responded.'
                                            : backgroundTestResult.status === 'fallback'
                                                ? 'Local fallback responded. Bind production services before paid workflows go live.'
                                                : `Error: ${backgroundTestResult.error}`}
                                    </p>
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

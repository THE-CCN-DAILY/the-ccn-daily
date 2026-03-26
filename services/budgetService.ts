import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface UsageLog {
    userId: string;
    feature: string;
    model: string;
    tokens?: number;
    costEstimate?: number;
    timestamp: any;
}

export const trackAiUsage = async (userId: string, feature: string, model: string, tokens: number = 0) => {
    try {
        // Simple cost estimation logic
        let costPer1k = 0;
        if (model.includes('pro')) costPer1k = 0.01; // $0.01 per 1k tokens
        else if (model.includes('flash-lite')) costPer1k = 0.0001; // Very cheap
        else if (model.includes('flash')) costPer1k = 0.001;

        const costEstimate = (tokens / 1000) * costPer1k;

        await addDoc(collection(db, 'ai_usage'), {
            userId,
            feature,
            model,
            tokens,
            costEstimate,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error tracking AI usage:", error);
    }
};

export const getUsageStats = async (days: number = 30) => {
    const q = query(collection(db, 'ai_usage'), orderBy('timestamp', 'desc'), limit(1000));
    const snapshot = await getDocs(q);
    
    const logs = snapshot.docs.map(doc => doc.data() as UsageLog);
    
    const totalCost = logs.reduce((sum, log) => sum + (log.costEstimate || 0), 0);
    const featureBreakdown = logs.reduce((acc: any, log) => {
        acc[log.feature] = (acc[log.feature] || 0) + (log.costEstimate || 0);
        return acc;
    }, {});

    return {
        totalCost,
        featureBreakdown,
        recentLogs: logs.slice(0, 10)
    };
};

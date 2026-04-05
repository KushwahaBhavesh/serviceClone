import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';

/**
 * AI Assistant Chat Controller
 * Implements the "Concise AI Assistant" persona logic.
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
    const { content, context } = req.body;
    const { userPlan = 'FREE', userName = 'User' } = context || {};

    // Mock implementation for now.
    // In a production environment, this would call Gemini, OpenAI, or a local model.
    // The response logic here demonstrates the plan-aware personality instructions.
    
    let reply = "";
    
    // Example logic based on the persona prompt provided by the user
    if (content.toLowerCase().includes('hello') || content.toLowerCase().includes('hi')) {
        reply = `Hi ${userName}. How can I assist with your services today?`;
    } else if (content.toLowerCase().includes('plan') || content.toLowerCase().includes('upgrade')) {
        if (userPlan === 'FREE') {
            reply = "You're on the Free plan. To get more detailed answers and premium features, consider upgrading to Pro.";
        } else {
            reply = `You're currently on the ${userPlan} plan with full assistant access.`;
        }
    } else {
        // Generic "Concise" response
        reply = "I've noted your request. To help further, please specify which service category or booking you have in mind.";
    }

    // In 'Pro' or 'Enterprise', we would provide more depth if available.
    if (userPlan !== 'FREE' && content.length > 20) {
        reply += " (Detailed insights enabled for your account)";
    }

    res.status(200).json({
        success: true,
        reply
    });
});

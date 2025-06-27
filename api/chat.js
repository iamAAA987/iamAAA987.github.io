// Vercel Serverless Function
// Docs: https://vercel.com/docs/functions/serverless-functions

// This function will run on Node.js environment on Vercel's servers.
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { question, resumeData } = await request.body;
        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            return response.status(500).json({ error: 'API key is not configured.' });
        }
        
        if (!question || !resumeData) {
            return response.status(400).json({ error: 'Question and resume data are required.' });
        }

        const systemPrompt = `你是一名叫做"高艺佳AI助理"的AI助手。你的任务是基于以下简历信息，友好并专业地回答用户的问题。
        简历信息如下:
        ---
        ${JSON.stringify(resumeData, null, 2)}
        ---
        请只根据以上信息回答，如果问题与简历无关，请礼貌地拒绝，并引导用户提出和简历相关的问题。`;

        const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        "content": systemPrompt,
                        "role": "system"
                    },
                    {
                        "content": question,
                        "role": "user"
                    }
                ],
                // stream: true // For typewriter effect later
            }),
        });

        if (!deepseekResponse.ok) {
            const errorBody = await deepseekResponse.text();
            console.error('DeepSeek API error:', errorBody);
            return response.status(deepseekResponse.status).json({ error: `Failed to get response from DeepSeek API. Status: ${deepseekResponse.status}` });
        }

        const result = await deepseekResponse.json();
        const aiMessage = result.choices[0]?.message?.content;

        if (!aiMessage) {
            return response.status(500).json({ error: 'Failed to extract AI message from response.' });
        }

        response.status(200).json({ reply: aiMessage });

    } catch (error) {
        console.error('Error in chat handler:', error);
        response.status(500).json({ error: 'An internal server error occurred.' });
    }
} 
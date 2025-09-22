const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'REMOVED';

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check for greeting messages and provide special medical greeting
    const lowerMessage = message.toLowerCase().trim();
    const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'hiya'];

    if (greetingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      const greetingResponse = `🩺 Hi! I'm Dr. MedBot, your AI medical assistant. I provide general health information only. What health question can I help with?`;

      return Response.json({ response: greetingResponse });
    }

    // Optional: Query external services for additional context
    let additionalInfo = '';
    try {
      // Add your custom data sources here if needed
      // const response = await fetch(`your-custom-api-endpoint`);
      // if (response.ok) {
      //   const data = await response.json();
      //   additionalInfo = `Additional context: ${JSON.stringify(data)}`;
      // }
    } catch (error) {
      console.log('External service not available:', error.message);
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are Dr. MedBot. Give ultra-concise health info in 1-2 short sentences. No emojis, no references, no citations. Be direct and clear. Always end with: "⚠️ General info only. See doctor for personal advice."',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 100,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Simplified response parsing
    let aiResponse = '';

    try {
      if (data.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content;
      } else {
        aiResponse = 'I apologize, but I couldn\'t generate a response.';
      }

      // Clean up response and ensure disclaimer is present
      aiResponse = aiResponse.replace(/^🩺\s*/, ''); // Remove leading emoji if present
      aiResponse = aiResponse.replace(/\[\d+\]/g, ''); // Remove citation references like [1][2][5]
      aiResponse = aiResponse.trim();

      if (!aiResponse.includes('⚠️')) {
        aiResponse += '\n\n⚠️ General info only. See doctor for personal advice.';
      }
    } catch (parseError) {
      aiResponse = 'I apologize, but there was an error processing the response. Please try again.';
    }

    return Response.json({ response: aiResponse });
  } catch (error) {
    return Response.json({
      error: 'Failed to get response from AI',
      details: error.message
    }, { status: 500 });
  }
}

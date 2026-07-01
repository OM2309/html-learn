export const prdResponseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    goal: { type: 'string' },
    requirements: {
      type: 'array',
      items: { type: 'string' }
    },
    edgeCases: {
      type: 'array',
      items: { type: 'string' }
    },
    errorStates: {
      type: 'array',
      items: { type: 'string' }
    },
    mockServices: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['title', 'description', 'goal', 'requirements', 'edgeCases', 'errorStates', 'mockServices']
};

export const modelsToTry = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];
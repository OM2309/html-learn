import ai from '../config/gemini.js';
import PRD from '../models/prd.model.js';
import { systemInstruction, proposalSystemInstruction } from '../config/prompt.js';
import { buildProposalPrompt, buildGeneratePrompt } from '../utils/prdHelper.js';
import { prdResponseSchema, modelsToTry } from '../constants/prd.constants.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const promiseWithTimeout = (promise, ms) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Gemini API request timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const streamProposal = async (req, res) => {
  console.log("Incomming request in stream propsal")
  const prompt = req.body?.prompt || req.query?.prompt;
  let previousProposal = req.body?.previousProposal || req.query?.previousProposal;

  if (previousProposal && typeof previousProposal === 'string') {
    try {
      previousProposal = JSON.parse(previousProposal);
    } catch (e) {
      console.log(e)
    }
  }
  const feedback = req.body?.feedback || req.query?.feedback;

  if (!prompt) {
    console.warn('streamProposal bad request: Prompt is required');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Prompt is required' }));
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const proposalPrompt = buildProposalPrompt(prompt, previousProposal, feedback);
  let responseStream;

  let lastError;

  for (const model of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`Attempting proposal streaming with model: ${model} (attempt ${attempts}/${maxAttempts})`);
        responseStream = await promiseWithTimeout(
          ai.models.generateContentStream({
            model: model,
            contents: proposalPrompt,
            config: {
              systemInstruction: proposalSystemInstruction,
            }
          }),
          15000
        );
        break;
      } catch (err) {
        console.warn(`Model ${model} stream attempt ${attempts} failed: ${err.message || err}`);
        lastError = err;
        if (attempts < maxAttempts) {
          await sleep(2000);
        }
      }
    }
    if (responseStream) break;
  }

  if (!responseStream) {
    console.error('Proposal streaming initialization failed:', lastError);
    res.write(`data: ${JSON.stringify({ error: lastError?.message || 'Failed to initialize proposal stream' })}\n\n`);
    return res.end();
  }

  try {
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
      }
    }
    res.end();
  } catch (error) {
    console.error('Error in proposal stream transmission:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream transmission interrupted' })}\n\n`);
    res.end();
  }
};



export const generatePRD = async (req, res) => {
  try {
    let { proposal } = req.body;
    console.log("incoming proposal:", proposal);

    if (!proposal) {
      console.warn('generatePRD bad request: Proposal text is required');
      return res.status(400).json({ error: 'Proposal text is required' });
    }

    const finalGeneratePrompt = buildGeneratePrompt(proposal);

    let fullText = '';
    let lastError;
    let success = false;

    for (const model of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        fullText = '';

        try {
          console.log(`Attempting generation with model: ${model} (attempt ${attempts}/${maxAttempts})`);

          const responseStream = await ai.models.generateContentStream({
            model,
            contents: finalGeneratePrompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: prdResponseSchema,
            },
          });

          for await (const chunk of responseStream) {
            if (chunk.text) fullText += chunk.text;
          }

          if (fullText) {
            console.log(`Successfully generated PRD with model: ${model}`);
            success = true;
            break;
          }
        } catch (err) {
          console.warn(`Model ${model} attempt ${attempts} failed: ${err.message || err}`);
          lastError = err;
          if (attempts < maxAttempts) await sleep(5000);
        }
      }

      if (success) break;
    }

    if (!success || !fullText) {
      throw lastError || new Error('All model attempts failed for generation');
    }

    let prdData;
    try {
      prdData = JSON.parse(fullText);
    } catch (e) {
      return res.status(500).json({
        error: 'Failed to parse JSON response',
        details: fullText,
      });
    }

    const savedPRD = await PRD.create(prdData);
    return res.status(201).json(savedPRD);

  } catch (error) {
    console.error('Error generating PRD:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during PRD generation' });
  }
};

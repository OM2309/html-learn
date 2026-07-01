export const buildProposalPrompt = (prompt, previousProposal = '', feedback = '') => {
  // Revision flow: previous proposal exists AND user gave new feedback
  if (previousProposal && feedback) {
    return `Here is the proposal you previously generated:

---
${previousProposal}
---

The user has reviewed it and wants the following changes:
"${feedback}"

Rewrite the proposal from scratch incorporating this feedback. Keep the same structure (core approach, libraries, challenges) but adjust the content based on what the user asked to change. Do not acknowledge the feedback explicitly — just present the updated proposal naturally.`;
  }

  // Fresh proposal flow
  return `A user has described the following requirement:

"${prompt}"

Based on this, write a clear proposal covering:
1. Core Approach — how the system will be structured and function at a high level
2. Recommended Libraries & Technologies — specific packages and why each one is needed
3. Potential Challenges & Risks — security vulnerabilities or implementation difficulties and how you plan to address them

Be specific and technical, but write in plain conversational English. No bullet point lists — use flowing paragraphs.`;
};


export const buildGeneratePrompt = (proposal) => {
  return `The following proposal has been reviewed and approved by the user:

---
${proposal}
---

Based on this approved proposal, generate a complete PRD JSON document. Every field must be precise and technical:

- requirements: Each item must specify HTTP method, route, request shape, response shape, and security rules
- edgeCases: Each item must describe a specific boundary condition and the exact HTTP response (status code + payload)
- errorStates: Each item must name the failure scenario with exact HTTP status code and JSON error payload
- mockServices: Each item must name the external dependency and describe its mock behavior (success + failure cases)

Do not add features not mentioned in the proposal. Do not leave any field empty or generic.`;
};


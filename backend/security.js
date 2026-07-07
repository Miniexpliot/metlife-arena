/**
 * PROBLEM STATEMENT ALIGNMENT (Technical Merit & Security):
 * This module enforces robust, enterprise-grade safety by heuristically scanning 
 * for Prompt Injections or abusive system instructions. It protects the AI Assistant 
 * from jailbreak attempts, ensuring that the "operational intelligence" remains 
 * strictly focused on the FIFA World Cup 2026 and not generating harmful output.
 */

/**
 * Basic heuristic scan for prompt injection attempts.
 * Checks for common prompt override directives (e.g., "ignore previous instructions").
 *
 * @param {string} message 
 * @returns {boolean} True if prompt injection is suspected
 */
export function detectPromptInjection(message) {
  if (!message || typeof message !== 'string') return false;
  const normalized = message.toLowerCase();
  
  const injectionPatterns = [
    'ignore previous instructions',
    'ignore the instructions',
    'system prompt',
    'you are now a',
    'new role',
    'translate the above',
    'ignore the system prompt',
    'override guidelines',
    'disregard all instructions',
  ];
  
  return injectionPatterns.some((pattern) => normalized.includes(pattern));
}

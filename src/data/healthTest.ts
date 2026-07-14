/**
 * Sağlık testi — web `healthTest.js` + sections re-export.
 */
export { HEALTH_SECTIONS } from './healthTestSections.full.js';

export {
  HEALTH_AUDIENCE_META,
  EMPTY_HEALTH_TEST,
  isDetailVisible,
  isDetailFilled,
  isQuestionFullyAnswered,
  normalizeHealthTestForAnalysis,
  getApplicableSections,
  getSectionQuestions,
  getSectionProgress,
  isSectionComplete,
  getHealthTestHubSections,
  countCompletedSections,
  getOverallHealthTestProgress,
  isHealthTestComplete,
  hasStoredAnswer,
  describeHealthTest,
} from './healthTest.full.js';

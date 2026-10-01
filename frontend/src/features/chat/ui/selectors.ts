import type { ChatState } from './store';

export const selectConversation = (state: ChatState) => state.conversation;
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsGenerating = (state: ChatState) => state.isGenerating;

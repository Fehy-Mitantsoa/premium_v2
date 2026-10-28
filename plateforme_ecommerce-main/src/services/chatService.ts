/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { Product } from '../types';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  type?: string;
  isComparison?: boolean;
  products?: Partial<Product>[];
  quickReplies?: string[];
  escalateToHuman?: boolean;
  feedback?: 'like' | 'dislike' | null;
}

export interface ChatResponse {
  reply: string;
  language?: string;
  type?: string;
  products?: Partial<Product>[];
  quickReplies?: string[];
  escalateToHuman?: boolean;
}

/**
 * Service pour interagir avec l'API chatbot e-commerce
 */
export async function sendChatMessage(
  message: string,
  userId?: string,
  sessionId?: string,
  conversationHistory: { role: string; content: string }[] = [],
  detectedLanguage?: string,
  userEmail?: string
): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>(
      '/api/chat',
      {
        message: message.trim(),
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        sessionId: sessionId || undefined,
        conversationHistory,
        detectedLanguage: detectedLanguage || undefined,
      },
      { timeout: 25000 }
    );

    if (response.data && response.data.reply) {
      return response.data;
    }

    throw new Error('Réponse invalide du serveur');
  } catch (error: any) {
    console.warn('Chat service request status:', error?.message || error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Le serveur a mis trop de temps à répondre. Veuillez réessayer.');
    }
    if (error.response?.data?.reply) {
      return { reply: error.response.data.reply };
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.message === 'Network Error' || !error.response) {
      throw new Error('Connexion réseau interrompue. Veuillez vérifier votre connexion.');
    }
    throw new Error('Une erreur s\'est produite lors de la communication avec l\'assistant.');
  }
}

/**
 * Récupère l'historique de conversation persistant
 */
export async function fetchChatHistory(
  userId?: string,
  sessionId?: string
): Promise<ChatMessage[]> {
  try {
    const response = await axios.get<{ history: any[] }>(`/api/chat/history`, {
      params: { userId, sessionId },
      timeout: 10000,
    });

    if (response.data && Array.isArray(response.data.history)) {
      return response.data.history.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    }
    return [];
  } catch (error) {
    console.warn('Could not fetch remote chat history:', error);
    return [];
  }
}

/**
 * Réinitialise l'historique de conversation
 */
export async function resetChatHistory(
  userId?: string,
  sessionId?: string
): Promise<boolean> {
  try {
    await axios.delete('/api/chat/history', {
      params: { userId, sessionId },
      timeout: 10000,
    });
    return true;
  } catch (error) {
    console.warn('Could not reset remote chat history:', error);
    return false;
  }
}

/**
 * Soumet un avis 👍 / 👎 sur un message du bot
 */
export async function submitFeedback(
  messageId: string,
  rating: 'like' | 'dislike',
  feedbackText?: string
): Promise<boolean> {
  try {
    await axios.post('/api/chat/feedback', {
      messageId,
      rating,
      feedbackText,
    });
    return true;
  } catch (error) {
    console.warn('Could not submit message feedback:', error);
    return false;
  }
}

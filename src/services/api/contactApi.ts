import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  preferredContact: 'email' | 'phone';
}

interface ContactResponse {
  success: boolean;
  message: string;
}

export const contactApi = {
  async submit(payload: ContactPayload): Promise<ContactResponse> {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        data?.message ||
        'Failed to send your message. Please try again.';
      throw new Error(errorMessage);
    }

    return {
      success: Boolean(data?.success),
      message: data?.message || 'Your message has been sent successfully',
    };
  },
};

export default contactApi;

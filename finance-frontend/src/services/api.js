import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictGoal = async (data) => {
  try {
    const response = await api.post('/predict', data);
    return response.data;
  } catch (error) {
    console.error('Error predicting goal:', error);
    throw error;
  }
};

export const getRecommendation = async (data) => {
  try {
    const response = await api.post('/recommend', data);
    return response.data;
  } catch (error) {
    console.error('Error getting recommendation:', error);
    throw error;
  }
};

export default api;

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust if your backend runs on a different port/host

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
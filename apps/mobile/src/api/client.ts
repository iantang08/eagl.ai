import axios, {AxiosInstance, AxiosError} from 'axios';
import {config} from '../config';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const createClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    requestConfig => {
      if (authToken) {
        requestConfig.headers.Authorization = `Bearer ${authToken}`;
      }
      return requestConfig;
    },
    error => Promise.reject(error),
  );

  client.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        setAuthToken(null);
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createClient();

import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

interface AxiosErrorResponse {
  code?: string;
};

interface FailedRequest {
  onSuccess: (token: string) => void;
  onFailure: (err: AxiosError) => void;
};

let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError<AxiosErrorResponse>) => {
    if (error?.response?.status === 401) {
      if (error?.response?.data?.code === 'token.expired') {
        cookies = parseCookies(ctx);

        const { 'nextauth.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config;

        if (!isRefreshing) {
          isRefreshing = true;

          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const { token } = response.data;

            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            });

            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            });

            if (typeof window !== 'undefined') {
              signOut();
            }
          }).catch(err => {
            failedRequestsQueue.forEach(request => request.onFailure(err));
            failedRequestsQueue = [];
          }).finally(() => {
            isRefreshing = false;
          })
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;

              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          })
        });

      } else {
        if (typeof window !== 'undefined') {
          signOut();
        } else {
          Promise.reject(new AuthTokenError())
        }
      }
    }

    return Promise.reject(error);
  });

  return api;
}
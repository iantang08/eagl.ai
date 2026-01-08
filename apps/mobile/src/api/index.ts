import {apiClient} from './client';
import {
  User,
  OnboardingProfile,
  SubscriptionStatus,
  Video,
  AnalysisJob,
  AnalysisResult,
} from '../types';

// Auth
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const signup = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/v1/auth/signup', {
    email,
    password,
  });
  return response.data;
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/v1/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/v1/auth/me');
  return response.data;
};

// Onboarding
export const saveOnboardingProfile = async (
  profile: OnboardingProfile,
): Promise<OnboardingProfile> => {
  const response = await apiClient.post<OnboardingProfile>(
    '/v1/onboarding/profile',
    profile,
  );
  return response.data;
};

export const getOnboardingProfile = async (): Promise<OnboardingProfile> => {
  const response = await apiClient.get<OnboardingProfile>(
    '/v1/onboarding/profile',
  );
  return response.data;
};

// Subscriptions
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await apiClient.get<SubscriptionStatus>(
    '/v1/subscriptions/status',
  );
  return response.data;
};

export const devActivateSubscription =
  async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.post<SubscriptionStatus>(
      '/v1/subscriptions/dev_activate',
    );
    return response.data;
  };

// Uploads
export interface PresignResponse {
  upload_url: string;
  s3_key: string;
}

export const getPresignedUrl = async (
  filename: string,
  contentType: string,
): Promise<PresignResponse> => {
  const response = await apiClient.post<PresignResponse>('/v1/uploads/presign', {
    filename,
    content_type: contentType,
  });
  return response.data;
};

export const uploadToUrl = async (
  uploadUrl: string,
  file: {uri: string; type: string},
  onProgress?: (progress: number) => void,
): Promise<void> => {
  const response = await fetch(file.uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        const progress = event.loaded / event.total;
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Upload failed due to network error'));
    };

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(blob);
  });
};

// Videos
export const createVideo = async (s3Key: string): Promise<Video> => {
  const response = await apiClient.post<Video>('/v1/videos', {s3_key: s3Key});
  return response.data;
};

export const getVideos = async (): Promise<Video[]> => {
  const response = await apiClient.get<Video[]>('/v1/videos');
  return response.data;
};

export const getVideo = async (videoId: string): Promise<Video> => {
  const response = await apiClient.get<Video>(`/v1/videos/${videoId}`);
  return response.data;
};

// Analysis
export const createAnalysisJob = async (videoId: string): Promise<AnalysisJob> => {
  const response = await apiClient.post<AnalysisJob>('/v1/analysis_jobs', {
    video_id: videoId,
    criteria_version: 'v1',
  });
  return response.data;
};

export const getAnalysisJob = async (jobId: string): Promise<AnalysisJob> => {
  const response = await apiClient.get<AnalysisJob>(
    `/v1/analysis_jobs/${jobId}`,
  );
  return response.data;
};

export const getAnalysisResult = async (
  resultId: string,
): Promise<AnalysisResult> => {
  const response = await apiClient.get<AnalysisResult>(
    `/v1/analysis_results/${resultId}`,
  );
  return response.data;
};

export const fetchAnalysisResults = async (
  resultsJsonUrl: string,
): Promise<any> => {
  const response = await fetch(resultsJsonUrl);
  return response.json();
};

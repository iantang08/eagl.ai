export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface OnboardingProfile {
  goals: string[];
  skill_level: string | null;
  dominant_hand: string | null;
  typical_miss: string | null;
  equipment_focus: string[];
  practice_frequency: string | null;
}

export interface SubscriptionStatus {
  is_active: boolean;
  plan: string | null;
  expires_at: string | null;
}

export interface Video {
  id: string;
  user_id: string;
  s3_key_raw: string;
  duration_ms: number | null;
  fps: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface AnalysisJob {
  id: string;
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  criteria_version: string;
  error: string | null;
  progress: number;
  result_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface PhaseTimestamp {
  name: string;
  frame: number;
  timestamp_ms: number;
}

export interface RubricItem {
  name: string;
  score: number;
  max_score: number;
  explanation: string;
  timestamp_ms: number | null;
}

export interface AnalysisResults {
  criteria_version: string;
  overall_score: number;
  analysis_confidence: number;
  phases: PhaseTimestamp[];
  metrics: {
    frames_analyzed: number;
    valid_pose_frames: number;
    video_duration_ms: number;
  };
  rubric: RubricItem[];
}

export interface AnalysisResult {
  id: string;
  job_id: string;
  overall_score: number;
  results_json_url: string;
  thumbnail_url: string;
  created_at: string;
}

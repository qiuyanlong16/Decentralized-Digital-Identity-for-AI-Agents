export interface Skill {
  name: string;
  desc: string;
  version: string;
  source: "clawhub" | "self-evolved" | "custom";
}

export interface Channel {
  type: "telegram" | "discord" | "wechat" | "email" | "custom";
  id: string;
}

export interface Stats {
  days_since_creation: number;
  total_skills: number;
  total_conversations: number;
}

export interface TrustInfo {
  public_key: string;
  signature: string;
  issuer: "self";
  created_at: string;
  updated_at: string;
}

export interface AgentProfile {
  v: 1;
  did: string;
  name: string;
  avatar?: string;
  personality?: string;
  framework: {
    type: "hermes" | "openclaw" | "other";
    version: string;
  };
  skills: Skill[];
  capabilities: string[];
  channels: Channel[];
  stats?: Stats;
  trust: TrustInfo;
  qr_token?: string;
  profile_url?: string;
}

export interface RegisterRequest {
  profile: Omit<AgentProfile, "qr_token" | "profile_url">;
  signature: string;
}

export interface RegisterResponse {
  success: boolean;
  qr_token: string;
  profile_url: string;
  did: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

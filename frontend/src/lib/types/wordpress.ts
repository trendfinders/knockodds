// WordPress REST API Types for Headless CMS

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  type: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  featured_media: number;
  categories: number[];
  tags: number[];
  acf?: Record<string, any>;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string; media_details: { width: number; height: number } }>;
  };
}

export interface WPNewsPost extends WPPost {
  type: 'news';
  acf: {
    source_url: string;
    original_title: string;
    rewrite_status: 'pending' | 'rewritten' | 'published';
    seo_score: number;
    seo_title?: string;
    meta_description?: string;
    focus_keyword?: string;
    featured_image_cdn: string;
    blur_placeholder: string;
  };
}

export interface WPFighterPost extends WPPost {
  type: 'fighter';
  acf: {
    fighter_api_id: number;
    category: string;
    team_name: string;
    record_wins: number;
    record_losses: number;
    record_draws: number;
    photo_cdn: string;
    last_synced: string;
  };
}

export interface WPFightPost extends WPPost {
  type: 'fight';
  acf: {
    fight_api_id: number;
    event_slug: string;
    fight_date: string;
    category: string;
    fighter1_id: number;
    fighter2_id: number;
    status: string;
    is_main: boolean;
    last_synced: string;
  };
}

export interface WPPronosticPost extends WPPost {
  type: 'pronostic';
  acf: {
    fight_api_id: number;
    predicted_winner_id: number;
    confidence: number;
    predicted_method: string;
    value_bets: string; // JSON string
    analysis_data: string; // JSON string
  };
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text: string;
  media_details: {
    width: number;
    height: number;
    sizes: Record<string, { source_url: string; width: number; height: number }>;
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WPPaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
}

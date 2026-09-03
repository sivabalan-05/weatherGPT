export interface LocationInfo {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  pressure: number;
  weather_code: number;
  condition: string;
  icon: string;
  category: string;
  is_day: boolean;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  code: number;
  condition: string;
  icon: string;
  precip_prob: number;
  wind_speed: number;
}

export interface DailyForecastItem {
  date: string;
  max_temp: number;
  min_temp: number;
  code: number;
  condition: string;
  icon: string;
  precip_sum: number;
  precip_prob_max: number;
  sunrise: string;
  sunset: string;
  uv_index: number;
}

export interface ForecastResponse {
  location: LocationInfo;
  current: CurrentWeather;
  summary: string;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface AlertItem {
  id: string;
  type: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  headline: string;
  description: string;
  instruction: string;
  issued_time: string;
  valid_until: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  badge?: string;
  rating?: string;
  key_facts?: string[];
  action_advice?: string;
  suggested_followups?: string[];
  location_tagged?: string;
  extracted_entities?: {
    location?: string;
    timeframe?: string;
    intent?: string;
  };
  verified_data?: Record<string, any>;
  active_alerts?: AlertItem[];
  grounded_source?: string;
}

export interface CropInfo {
  id: string;
  name: string;
  type: string;
}

export interface AgriAdvisoryResponse {
  crop: {
    name: string;
    type: string;
    water_need: string;
    sensitive_to: string;
  };
  rainfall_forecast: {
    next_3_days_mm: number;
    next_7_days_mm: number;
    trend: string;
  };
  irrigation: {
    status: string;
    badge_color: string;
    guidance: string;
  };
  activities: Array<{
    activity: string;
    recommendation: string;
    favorable: boolean;
  }>;
  risks: Array<{
    level: string;
    title: string;
    detail: string;
  }>;
  disclaimer: string;
}

export interface MonthlyClimateItem {
  month: string;
  avg_max_temp: number;
  avg_min_temp: number;
  mean_temp: number;
  recorded_rainfall_mm: number;
  normal_rainfall_mm: number;
  rainfall_departure_pct: number;
}

export interface ClimateTrendsResponse {
  location_name: string;
  coordinates: { latitude: number; longitude: number };
  annual_rainfall_mm: number;
  normal_annual_rainfall_mm: number;
  annual_mean_temp_c: number;
  rainfall_status: string;
  monthly_trends: MonthlyClimateItem[];
  climate_summary: string;
}

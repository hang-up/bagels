export type QueueStatus = "queued" | "processing" | "complete";

export type FamilyProfile = {
  id: string;
  name: string;
  relationship_label: string;
  heritage_pack_ids: string[];
  language_tags: string[];
};

export type HeritagePack = {
  id: string;
  label: string;
};

export type QueueItem = {
  id: string;
  profile_id: string;
  story_id: string | null;
  title: string;
  duration_seconds: number;
  waveform_seed?: string;
  submitted_at?: string;
  status: QueueStatus;
};

export type StoryBeat = {
  id: string;
  kind?: string;
  theme?: string;
  experience: string;
  title: string;
  content: string;
  content_origin?: string;
  visual_prompt?: string;
  ambient_detail?: string;
  image_url?: string;
  asset_url?: string;
  ingredients?: string[];
  rituals?: string[];
};

export type StoryPayload = {
  id: string;
  profile_id: string;
  heritage_pack_id: string;
  metadata: {
    title: string;
    created_at?: string;
    created_by?: string;
    speaker?: string;
    audience?: string;
    heritage_tags?: string[];
    language_tags?: string[];
    tone?: string[];
  };
  beats: StoryBeat[];
  throughline?: string;
  dedication?: string;
};

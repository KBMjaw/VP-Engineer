import type { AreaUnitKey, CategoryKey, PhaseKey, ProjectStatusKey } from '../config/site';

export interface ProjectImage {
  id: string;
  project_id: string;
  storage_path: string;
  phase: PhaseKey;
  caption: string | null;
  taken_on: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
  /** Signed URL, filled in client-side. */
  url?: string;
}

export interface Project {
  id: string;
  title: string;
  category: CategoryKey;
  site_type: string | null;
  description: string | null;
  location: string | null;
  address: string | null;
  maps_url: string | null;
  site_area: number | null;
  built_up_area: number | null;
  area_unit: AreaUnitKey;
  client_reference: string | null;
  start_date: string | null;
  completion_date: string | null;
  project_status: ProjectStatusKey;
  is_published: boolean;
  published_at: string | null;
  cover_image_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  project_images?: ProjectImage[];
}

/** Editable project fields (what the admin form saves). */
export type ProjectInput = Pick<
  Project,
  | 'title'
  | 'category'
  | 'site_type'
  | 'description'
  | 'location'
  | 'address'
  | 'maps_url'
  | 'site_area'
  | 'built_up_area'
  | 'area_unit'
  | 'client_reference'
  | 'start_date'
  | 'completion_date'
  | 'project_status'
>;

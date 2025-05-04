
export type IssueSeverity = 'minor' | 'moderate' | 'urgent';
export type IssueCategory = 'technical' | 'interpersonal' | 'safety' | 'resource' | 'feedback' | 'other';
export type IssueLocation = 'common_areas' | 'tent_cabin' | 'event_venue' | 'not_sure' | 'other';
export type IssueStatus = 'submitted' | 'in_review' | 'in_progress' | 'resolved' | 'closed';

export interface IssueReport {
  id: string;
  category: IssueCategory;
  title: string;
  details?: string;
  location?: IssueLocation;
  location_detail?: string;
  severity?: IssueSeverity;
  is_anonymous: boolean;
  status: IssueStatus;
  created_at: string;
  updated_at: string;
  reporter_id?: string;
  assignee_id?: string;
  contact_info?: {
    name?: string;
    email?: string;
    telegram?: string;
    preferred_contact_method?: string;
    preferred_contact_time?: string;
  };
  tags?: string[];
  tracking_code: string;
}

export interface IssueAttachment {
  id: string;
  issue_id: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  profile_id?: string;
  is_anonymous: boolean;
  comment: string;
  created_at: string;
}

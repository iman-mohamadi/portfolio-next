export interface Project {
  id: string;
  sysId: string;
  category: string;
  title: string;
  description: string;
  tech: string;
  image: string;
  buttonLabel: string;
  type: 'metrics' | 'platform' | 'experience';
  metrics?: {
    label: string;
    value: string;
    unit?: string;
    change?: string;
  }[];
  overview?: string;
  architectureHighlights?: string[];
  techStack?: string[];
  liveUrl?: string;
}

export interface CapabilityItem {
  id: string;
  number: string;
  title: string;
  description: string;
  category: string;
  stats: {
    projects: number;
    latencyAverage: string;
    uptimeScore: string;
  };
  technologies: string[];
}

export interface CommitCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContactFormData {
  name: string;
  email: string;
  parameters: string;
  budgetOrTimeline?: string;
}

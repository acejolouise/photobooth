export interface Photo {
  id: string;
  dataUrl: string;
  filter: string;
}

export interface PhotoSession {
  id: string;
  photos: Photo[];
  createdAt: Date;
}

export type FilterType = 
  | 'none'
  | 'normal'
  | 'sepia'
  | 'vintage'
  | 'noir'
  | 'vivid'
  | 'dreamy'
  | 'blur'
  | 'pixelate'
  | 'pastel'
  | 'smooth'
  | 'sparkle';

export interface Filter {
  name: FilterType;
  label: string;
  icon: string;
}

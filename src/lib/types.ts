export type Subject = { id: string; code: string; name: string };
export type Tag = { id: string; name: string };

export type Lecturer = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  photo_url: string | null;
  department: string | null;
  avg_rating: number | null;
  review_count: number;
  subjects: Subject[];
  tags: Tag[];
};

export type LecturerStats = {
  avg_rating: number;
  review_count: number;
  avg_difficulty: number | null;
  would_take_again_pct: number | null;
  /** Review counts for 5, 4, 3, 2, 1 stars (in that order). */
  distribution: number[];
};

export type Trait = { name: string; uses: number };

export type Review = {
  id: string;
  rating: number;
  difficulty: number | null;
  would_take_again: boolean | null;
  comment: string | null;
  created_at: string;
  subject_code: string | null;
  tag_names: string[];
  score: number;
  /** The signed-in user's vote: 1, -1 or 0. */
  my_vote: number;
};

/** The signed-in user's own review of a lecturer, used to prefill the form. */
export type MyReview = {
  id: string;
  rating: number;
  difficulty: number | null;
  would_take_again: boolean | null;
  subject_id: string | null;
  comment: string | null;
  tag_ids: string[];
};

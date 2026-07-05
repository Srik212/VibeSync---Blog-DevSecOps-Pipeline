export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Post {
  id: number;
  author_id: number;
  title: string;
  content_md: string;
  tags: string; // JSON string in DB, parsed to string[] in API responses
  emoji: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  body: string;
  created_at: string;
}

export interface Reaction {
  id: number;
  post_id: number;
  user_id: number;
  emoji: string;
}

export interface AuthedRequestUser {
  id: number;
  username: string;
}

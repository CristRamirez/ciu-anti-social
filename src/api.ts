import type { Comment, Post, PostImage, Tag, User } from "./types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  getUsers: () => request<User[]>("/users"),
  getUser: (id: string) => request<User>(`/users/${id}`),
  createUser: (nickname: string) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    }),

  getPosts: () => request<Post[]>("/posts"),
  getTags: () => request<Tag[]>("/tags"),

  createPostForUser: (userId: string, texto: string, tags: string[] = []) =>
    request<Post>(`/posts/user/${userId}`, {
      method: "POST",
      body: JSON.stringify({ texto, tags }),
    }),

  createTag: (nombre: string) =>
    request<Tag>("/tags", {
      method: "POST",
      body: JSON.stringify({ nombre }),
    }),

  createPost: (userId: string, texto: string, tags: string[] = []) =>
    request<Post>("/posts", {
      method: "POST",
      body: JSON.stringify({ texto, tags, user: userId }),
    }),

  createPostImage: (postId: string, url_image: string) =>
    request<PostImage>("/post-images", {
      method: "POST",
      body: JSON.stringify({ id_post: postId, url_image }),
    }),

  getPostImages: (postId: string) =>
    request<PostImage[]>(`/post-images/post/${postId}`),

  getComments: (postId: string) =>
    request<Comment[]>(`/comments/post/${postId}`),
};

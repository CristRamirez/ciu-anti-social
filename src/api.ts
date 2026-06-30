import type { Post, Tag, User } from "./types";

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
};

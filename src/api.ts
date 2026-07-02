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
  // users
  getUsers: () => request<User[]>("/users"),
  getUser: (id: string) => request<User>(`/users/${id}`),
  createUser: (nickname: string) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    }),
  updateUser: (id: string, nickname: string) =>
    request<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ nickname }),
    }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: "DELETE" }),

  // posts
  getPosts: () => request<Post[]>("/posts"),
  getPostsByUser: (userId: string) =>
    request<Post[]>(`/posts/user/${userId}`),
  getPost: (userId: string, postId: string) =>
    request<Post>(`/posts/user/${userId}/post/${postId}`),
  createPost: (userId: string, texto: string, tags: string[]) =>
    request<Post>(`/posts/user/${userId}`, {
      method: "POST",
      body: JSON.stringify({ texto, tags }),
    }),
  updatePost: (
    userId: string,
    postId: string,
    texto: string,
    tags?: string[]
  ) =>
    request<Post>(`/posts/user/${userId}/post/${postId}`, {
      method: "PUT",
      body: JSON.stringify(tags ? { texto, tags } : { texto }),
    }),
  deletePost: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}`, { method: "DELETE" }),

  // tags
  getTags: () => request<Tag[]>("/tags"),
  createTag: (nombre: string) =>
    request<Tag>("/tags", {
      method: "POST",
      body: JSON.stringify({ nombre }),
    }),
  updateTag: (id: string, nombre: string) =>
    request<Tag>(`/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify({ nombre }),
    }),
  deleteTag: (id: string) =>
    request<{ message: string }>(`/tags/${id}`, { method: "DELETE" }),

  // comments
  getCommentsByPost: (postId: string) =>
    request<Comment[]>(`/comments/post/${postId}`),
  createComment: (userId: string, postId: string, texto: string) =>
    request<{ message: string }>(
      `/comments/user/${userId}/post/${postId}`,
      { method: "POST", body: JSON.stringify({ texto }) }
    ),
  updateComment: (
    userId: string,
    postId: string,
    commentId: string,
    texto: string
  ) =>
    request<{ message: string }>(
      `/comments/user/${userId}/post/${postId}/${commentId}`,
      { method: "PUT", body: JSON.stringify({ texto }) }
    ),
  deleteComment: (userId: string, postId: string, commentId: string) =>
    request<{ message: string }>(
      `/comments/user/${userId}/post/${postId}/${commentId}`,
      { method: "DELETE" }
    ),

  // post images
  getPostImages: (userId: string, postId: string) =>
    request<PostImage[]>(
      `/post-images/user/${userId}/post/${postId}/images`
    ),
  createPostImage: (userId: string, postId: string, url_image: string) =>
    request<PostImage>(
      `/post-images/user/${userId}/post/${postId}/images`,
      { method: "POST", body: JSON.stringify({ url_image }) }
    ),
  deletePostImage: (userId: string, postId: string, imageId: string) =>
    request<{ message: string }>(
      `/post-images/user/${userId}/post/${postId}/images/${imageId}`,
      { method: "DELETE" }
    ),
};

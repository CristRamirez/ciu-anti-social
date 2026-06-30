export interface User {
  _id: string;
  nickname: string;
}

export interface Tag {
  _id: string;
  nombre: string;
}

export interface Post {
  _id: string;
  texto: string;
  user: User | string;
  tags: Tag[];
  fechaPublicacion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  texto: string;
  user: string;
  post: string;
  visible: boolean;
  createdAt?: string;
}

export interface PostImage {
  _id: string;
  url_image: string;
  id_post: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface List {
  id: string;
  title: string;
  tasks: Task[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
  createdAt?: Date;
  updatedAt?: Date;
}

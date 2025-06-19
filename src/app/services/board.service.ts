import { Injectable, signal, computed, effect } from '@angular/core';
import { Board, List, Task } from '../models/trello.models';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private readonly STORAGE_KEY = 'trello-clone-board';

  // Default board data
  private getDefaultBoard(): Board {
    return {
      id: '1',
      title: 'My Trello Board',
      lists: [
        {
          id: '1',
          title: 'To Do',
          tasks: [
            {
              id: '1',
              title: 'Sample Task 1',
              description: 'This is a sample task description',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: '2',
              title: 'Sample Task 2',
              description: 'Another sample task',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'In Progress',
          tasks: [
            {
              id: '3',
              title: 'Working on this',
              description: 'Currently in progress',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Done',
          tasks: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Signal-based state management with localStorage
  private _board = signal<Board>(this.loadFromStorage());

  constructor() {
    // Auto-save to localStorage whenever board state changes
    effect(() => {
      const board = this._board();
      this.saveToStorage(board);
    });
  }

  // Public readonly signals
  readonly board = this._board.asReadonly();
  
  // Computed values
  readonly totalTasks = computed(() => 
    this._board().lists.reduce((total, list) => total + list.tasks.length, 0)
  );
  
  readonly totalLists = computed(() => this._board().lists.length);

  // Board methods
  updateBoardTitle(title: string): void {
    this._board.update(board => ({
      ...board,
      title,
      updatedAt: new Date()
    }));
  }

  // List methods
  createList(title: string): string {
    const newList: List = {
      id: this.generateId(),
      title,
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this._board.update(board => ({
      ...board,
      lists: [...board.lists, newList],
      updatedAt: new Date()
    }));

    return newList.id;
  }

  updateList(listId: string, updates: Partial<Omit<List, 'id' | 'createdAt'>>): void {
    this._board.update(board => ({
      ...board,
      lists: board.lists.map(list =>
        list.id === listId
          ? { ...list, ...updates, updatedAt: new Date() }
          : list
      ),
      updatedAt: new Date()
    }));
  }

  deleteList(listId: string): void {
    this._board.update(board => ({
      ...board,
      lists: board.lists.filter(list => list.id !== listId),
      updatedAt: new Date()
    }));
  }

  moveList(listId: string, newIndex: number): void {
    this._board.update(board => {
      const lists = [...board.lists];
      const listIndex = lists.findIndex(list => list.id === listId);
      
      if (listIndex === -1) return board;
      
      const [movedList] = lists.splice(listIndex, 1);
      lists.splice(newIndex, 0, movedList);
      
      return {
        ...board,
        lists,
        updatedAt: new Date()
      };
    });
  }

  // Task methods
  createTask(listId: string, title: string, description?: string): string {
    const newTask: Task = {
      id: this.generateId(),
      title,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this._board.update(board => ({
      ...board,
      lists: board.lists.map(list =>
        list.id === listId
          ? {
              ...list,
              tasks: [...list.tasks, newTask],
              updatedAt: new Date()
            }
          : list
      ),
      updatedAt: new Date()
    }));

    return newTask.id;
  }

  updateTask(listId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): void {
    this._board.update(board => ({
      ...board,
      lists: board.lists.map(list =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map(task =>
                task.id === taskId
                  ? { ...task, ...updates, updatedAt: new Date() }
                  : task
              ),
              updatedAt: new Date()
            }
          : list
      ),
      updatedAt: new Date()
    }));
  }

  deleteTask(listId: string, taskId: string): void {
    this._board.update(board => ({
      ...board,
      lists: board.lists.map(list =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.filter(task => task.id !== taskId),
              updatedAt: new Date()
            }
          : list
      ),
      updatedAt: new Date()
    }));
  }

  moveTask(fromListId: string, toListId: string, taskId: string, newIndex?: number): void {
    this._board.update(board => {
      const fromList = board.lists.find(list => list.id === fromListId);
      const toList = board.lists.find(list => list.id === toListId);
      const task = fromList?.tasks.find(t => t.id === taskId);

      if (!fromList || !toList || !task) return board;

      // Remove task from source list
      const updatedFromList = {
        ...fromList,
        tasks: fromList.tasks.filter(t => t.id !== taskId),
        updatedAt: new Date()
      };

      // Add task to destination list
      const updatedToList = {
        ...toList,
        tasks: newIndex !== undefined 
          ? [
              ...toList.tasks.slice(0, newIndex),
              { ...task, updatedAt: new Date() },
              ...toList.tasks.slice(newIndex)
            ]
          : [...toList.tasks, { ...task, updatedAt: new Date() }],
        updatedAt: new Date()
      };

      return {
        ...board,
        lists: board.lists.map(list => {
          if (list.id === fromListId) return updatedFromList;
          if (list.id === toListId) return updatedToList;
          return list;
        }),
        updatedAt: new Date()
      };
    });
  }

  moveTaskWithinList(listId: string, taskId: string, newIndex: number): void {
    this._board.update(board => ({
      ...board,
      lists: board.lists.map(list =>
        list.id === listId
          ? {
              ...list,
              tasks: this.reorderArray(list.tasks, taskId, newIndex),
              updatedAt: new Date()
            }
          : list
      ),
      updatedAt: new Date()
    }));
  }

  // Utility methods
  getListById(listId: string): List | undefined {
    return this._board().lists.find(list => list.id === listId);
  }

  getTaskById(listId: string, taskId: string): Task | undefined {
    const list = this.getListById(listId);
    return list?.tasks.find(task => task.id === taskId);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private reorderArray<T extends { id: string }>(array: T[], itemId: string, newIndex: number): T[] {
    const items = [...array];
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return items;
    
    const [movedItem] = items.splice(itemIndex, 1);
    items.splice(newIndex, 0, movedItem);
    
    return items;
  }

  // localStorage methods
  private loadFromStorage(): Board {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return this.deserializeBoard(parsed);
      }
    } catch (error) {
      console.warn('Failed to load board from localStorage:', error);
    }
    return this.getDefaultBoard();
  }

  private saveToStorage(board: Board): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(board));
    } catch (error) {
      console.warn('Failed to save board to localStorage:', error);
    }
  }

  private deserializeBoard(data: any): Board {
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      lists: data.lists?.map((list: any) => ({
        ...list,
        createdAt: list.createdAt ? new Date(list.createdAt) : new Date(),
        updatedAt: list.updatedAt ? new Date(list.updatedAt) : new Date(),
        tasks: list.tasks?.map((task: any) => ({
          ...task,
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date()
        })) || []
      })) || []
    };
  }

  // Method to clear storage (useful for development/testing)
  clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._board.set(this.getDefaultBoard());
  }

  // Method to export board data
  exportBoard(): string {
    return JSON.stringify(this._board(), null, 2);
  }

  // Method to import board data
  importBoard(boardData: string): boolean {
    try {
      const parsed = JSON.parse(boardData);
      const board = this.deserializeBoard(parsed);
      this._board.set(board);
      return true;
    } catch (error) {
      console.error('Failed to import board:', error);
      return false;
    }
  }
}

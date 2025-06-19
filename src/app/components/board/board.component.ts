import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ListComponent } from '../list/list.component';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, ListComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {
  private boardService = inject(BoardService);
  
  // Expose service signals to template
  board = this.boardService.board;
  totalTasks = this.boardService.totalTasks;
  totalLists = this.boardService.totalLists;

  // Board title editing state
  isEditingTitle = signal(false);
  editBoardTitle = signal('');

  onAddList() {
    const title = prompt('Enter list title:');
    if (title?.trim()) {
      this.boardService.createList(title.trim());
    }
  }

  onEditBoardTitle() {
    this.editBoardTitle.set(this.board().title);
    this.isEditingTitle.set(true);
  }

  onSaveBoardTitle() {
    const title = this.editBoardTitle().trim();
    if (title && title !== this.board().title) {
      this.boardService.updateBoardTitle(title);
    }
    this.isEditingTitle.set(false);
  }

  onCancelEditTitle() {
    this.isEditingTitle.set(false);
  }

  onDeleteList(listId: string) {
    if (confirm('Are you sure you want to delete this list and all its tasks?')) {
      this.boardService.deleteList(listId);
    }
  }

  onTaskDrop(event: CdkDragDrop<any>) {
    const { previousContainer, container, previousIndex, currentIndex } = event;
    
    if (previousContainer === container) {
      // Moving within the same list
      const listId = container.id;
      const taskId = event.item.data.id;
      this.boardService.moveTaskWithinList(listId, taskId, currentIndex);
    } else {
      // Moving between different lists
      const fromListId = previousContainer.id;
      const toListId = container.id;
      const taskId = event.item.data.id;
      this.boardService.moveTask(fromListId, toListId, taskId, currentIndex);
    }
  }
}

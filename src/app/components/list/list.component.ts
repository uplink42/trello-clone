import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { TaskComponent } from '../task/task.component';
import { List } from '../../models/trello.models';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent {
  @Input({ required: true }) list!: List;
  @Output() deleteList = new EventEmitter<string>();

  private boardService = inject(BoardService);

  onAddTask() {
    const title = prompt('Enter task title:');
    if (title?.trim()) {
      this.boardService.createTask(this.list.id, title.trim());
    }
  }

  onEditList() {
    const newTitle = prompt('Enter new list title:', this.list.title);
    if (newTitle?.trim() && newTitle !== this.list.title) {
      this.boardService.updateList(this.list.id, { title: newTitle.trim() });
    }
  }

  onDeleteList() {
    this.deleteList.emit(this.list.id);
  }

  onDeleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.boardService.deleteTask(this.list.id, taskId);
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

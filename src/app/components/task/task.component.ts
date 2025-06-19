import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/trello.models';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent {
  @Input({ required: true }) task!: Task;
  @Input({ required: true }) listId!: string;
  @Output() deleteTask = new EventEmitter<string>();

  private boardService = inject(BoardService);

  // Editing state
  isEditing = signal(false);
  editTitle = signal('');
  editDescription = signal('');

  onEditTask() {
    this.editTitle.set(this.task.title);
    this.editDescription.set(this.task.description || '');
    this.isEditing.set(true);
  }

  onSaveTask() {
    const title = this.editTitle().trim();
    const description = this.editDescription().trim();
    
    if (title && (title !== this.task.title || description !== (this.task.description || ''))) {
      this.boardService.updateTask(this.listId, this.task.id, {
        title,
        description: description || undefined
      });
    }
    
    this.isEditing.set(false);
  }

  onCancelEdit() {
    this.isEditing.set(false);
  }

  onDeleteTask() {
    this.deleteTask.emit(this.task.id);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
}

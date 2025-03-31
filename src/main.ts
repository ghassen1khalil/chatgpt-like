import { Component, OnInit } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ChatService, Message, ChatSession } from './chat.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'edit-label-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Edit Chat Label</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" style="width: 100%;">
        <mat-label>Chat Name</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Enter chat name">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" (click)="onSave()">Save</button>
    </mat-dialog-actions>
  `
})
export class EditLabelDialog {
  name: string = '';

  constructor(public dialogRef: MatDialogRef<EditLabelDialog>) {}

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close(this.name);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    EditLabelDialog
  ],
  template: `
    <mat-sidenav-container style="height: 100vh;">
      <mat-sidenav mode="side" opened style="width: 250px; padding: 16px;">
        <button mat-raised-button 
                color="primary" 
                (click)="createNewChat()"
                style="width: 100%; margin-bottom: 16px;"
                matTooltip="New Chat">
          <mat-icon>add</mat-icon>
        </button>
        
        <mat-nav-list>
          <mat-list-item *ngFor="let session of chatSessions"
                        [class.selected]="currentSession?.id === session.id"
                        style="cursor: pointer;">
            <div style="display: flex; align-items: center; width: 100%;"
                 (click)="selectSession(session.id)">
              <mat-icon matListItemIcon>chat</mat-icon>
              <div style="flex-grow: 1;">
                <span matListItemTitle>{{session.name}}</span>
                <span matListItemLine>{{session.createdAt | date:'short'}}</span>
              </div>
              <button mat-icon-button (click)="editSessionLabel(session); $event.stopPropagation()"
                      matTooltip="Edit Chat Name">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </mat-list-item>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <div class="chat-container">
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{currentSession?.name || 'Chat Interface'}}</mat-card-title>
              <div class="header-actions">
                <button mat-raised-button
                        color="accent"
                        [disabled]="!currentSession"
                        (click)="exportCurrentSession()"
                        matTooltip="Save Chat">
                  <mat-icon>save</mat-icon>
                </button>
              </div>
            </mat-card-header>
            
            <mat-card-content>
              <div class="message-container">
                <div *ngFor="let message of currentSession?.messages" 
                     class="message"
                     [ngClass]="{'user-message': message.isUser, 'bot-message': !message.isUser}">
                  {{ message.content }}
                </div>
              </div>
              
              <div class="input-container">
                <mat-form-field appearance="fill" style="flex: 1;">
                  <mat-label>Type your message</mat-label>
                  <input matInput [(ngModel)]="userInput" 
                         (keyup.enter)="sendMessage()"
                         placeholder="Type your message here...">
                </mat-form-field>
                
                <button mat-icon-button
                        color="primary"
                        (click)="copyLastMessage()"
                        [disabled]="!hasMessages()"
                        matTooltip="Copy Last Message">
                  <mat-icon>content_copy</mat-icon>
                </button>

                <button mat-raised-button 
                        color="primary" 
                        (click)="sendMessage()"
                        [disabled]="!userInput.trim()"
                        matTooltip="Send Message">
                  <mat-icon>send</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `
})
export class App implements OnInit {
  chatSessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  userInput = '';

  constructor(
    private chatService: ChatService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.chatService.getSessions().subscribe(sessions => {
      this.chatSessions = sessions;
    });

    this.chatService.getCurrentSession().subscribe(session => {
      this.currentSession = session;
    });
  }

  createNewChat() {
    this.chatService.createNewSession();
  }

  selectSession(sessionId: string) {
    this.chatService.selectSession(sessionId);
  }

  editSessionLabel(session: ChatSession) {
    const dialogRef = this.dialog.open(EditLabelDialog, {
      width: '300px',
      data: { name: session.name }
    });

    dialogRef.componentInstance.name = session.name;

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trim() !== '') {
        this.chatService.updateSessionName(session.id, result);
        this.snackBar.open('Chat label updated successfully!', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  sendMessage() {
    if (this.userInput.trim()) {
      const userMessage: Message = {
        content: this.userInput,
        isUser: true
      };
      
      this.chatService.addMessageToCurrentSession(userMessage);

      // Call the API
      this.chatService.sendMessage(this.userInput).subscribe({
        next: (response) => {
          const botMessage: Message = {
            content: response.message,
            isUser: false
          };
          this.chatService.addMessageToCurrentSession(botMessage);
        },
        error: (error) => {
          const errorMessage: Message = {
            content: 'Sorry, there was an error processing your request.',
            isUser: false
          };
          this.chatService.addMessageToCurrentSession(errorMessage);
          console.error('Error:', error);
        }
      });

      // Clear the input
      this.userInput = '';
    }
  }

  exportCurrentSession() {
    if (this.currentSession) {
      this.chatService.exportSession(this.currentSession.id).subscribe({
        next: () => {
          this.snackBar.open('Chat session exported successfully!', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Export error:', error);
          this.snackBar.open('Failed to export chat session', 'Close', {
            duration: 3000,
          });
        }
      });
    }
  }

  hasMessages(): boolean {
    return Boolean(this.currentSession?.messages && this.currentSession.messages.length > 0);
  }

  copyLastMessage() {
    if (this.currentSession?.messages && this.currentSession.messages.length > 0) {
      const lastMessage = this.currentSession.messages[this.currentSession.messages.length - 1];
      this.userInput = lastMessage.content;
      this.snackBar.open('Last message copied to input', 'Close', {
        duration: 2000,
      });
    }
  }
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideAnimations()
  ]
}).catch(err => console.error(err));
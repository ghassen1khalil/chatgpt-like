import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Message {
  content: string;
  isUser: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8080/api';
  private sessions = new BehaviorSubject<ChatSession[]>([]);
  private currentSession = new BehaviorSubject<ChatSession | null>(null);

  constructor(private http: HttpClient) {
    // Initialize with a default session
    this.createNewSession();
  }

  getCurrentSession(): Observable<ChatSession | null> {
    return this.currentSession.asObservable();
  }

  getSessions(): Observable<ChatSession[]> {
    return this.sessions.asObservable();
  }

  createNewSession() {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      name: `Chat ${this.sessions.value.length + 1}`,
      messages: [{
        content: 'Hello! How can I help you today?',
        isUser: false
      }],
      createdAt: new Date()
    };
    
    this.sessions.next([...this.sessions.value, newSession]);
    this.currentSession.next(newSession);
  }

  selectSession(sessionId: string) {
    const session = this.sessions.value.find(s => s.id === sessionId);
    if (session) {
      this.currentSession.next(session);
    }
  }

  updateSessionName(sessionId: string, newName: string) {
    const updatedSessions = this.sessions.value.map(session => 
      session.id === sessionId ? { ...session, name: newName } : session
    );
    this.sessions.next(updatedSessions);
    
    if (this.currentSession.value?.id === sessionId) {
      this.currentSession.next({ ...this.currentSession.value, name: newName });
    }
  }

  addMessageToCurrentSession(message: Message) {
    const currentSession = this.currentSession.value;
    if (currentSession) {
      currentSession.messages.push(message);
      this.sessions.next([...this.sessions.value]);
      this.currentSession.next({...currentSession});
    }
  }

  sendMessage(prompt: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, { prompt });
  }

  exportSession(sessionId: string): Observable<any> {
    const session = this.sessions.value.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return this.http.post(`${this.apiUrl}/export`, session);
  }
}
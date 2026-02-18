import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Column, Card } from '../store/kanban.store';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);
  private apiUrl = '/api/board';

  getBoard(): Observable<Column[]> {
    return this.http.get<Column[]>(`${this.apiUrl}/columns`);
  }

  moveCard(cardId: string, toColumnId: string, index: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/cards/${cardId}/move`, {
      columnId: toColumnId,
      index,
    });
  }

  addCard(columnId: string, card: Omit<Card, 'id'>): Observable<Card> {
    return this.http.post<Card>(`${this.apiUrl}/columns/${columnId}/cards`, card);
  }

  updateCard(cardId: string, changes: Partial<Card>): Observable<Card> {
    return this.http.patch<Card>(`${this.apiUrl}/cards/${cardId}`, changes);
  }

  deleteCard(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cards/${cardId}`);
  }
}

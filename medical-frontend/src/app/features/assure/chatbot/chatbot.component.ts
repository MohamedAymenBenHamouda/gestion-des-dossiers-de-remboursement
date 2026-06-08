import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface Message {
  role: 'user' | 'bot';
  content: string;
  time: Date;
  loading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbot-page">
      <div class="chat-header">
        <div class="bot-avatar">🤖</div>
        <div class="bot-info">
          <h2>Assistant MedRembours</h2>
          <p class="bot-status"><span class="status-dot"></span>En ligne </p>
        </div>
        <button class="clear-btn" (click)="clearChat()">🗑️ Effacer</button>
      </div>

      <div class="messages-area" #messagesArea>
        @if (messages.length === 0) {
          <div class="welcome-block">
            <div class="welcome-icon">🏥</div>
            <h3>Bonjour {{ prenom }} !</h3>
            <p>Je suis votre assistant pour vos dossiers de remboursement médical.</p>
            <p class="welcome-sub">Exemples de questions :</p>
            <div class="suggestions-grid">
              @for (s of suggestions; track s) {
                <button class="suggestion-chip" (click)="sendSuggestion(s)">{{ s }}</button>
              }
            </div>
          </div>
        }

        @for (msg of messages; track msg.time) {
          <div class="message-row" [class.user-row]="msg.role === 'user'">
            @if (msg.role === 'bot') { <div class="bot-bubble-avatar">🤖</div> }
            <div class="bubble" [class.user-bubble]="msg.role === 'user'" [class.bot-bubble]="msg.role === 'bot'">
              @if (msg.loading) {
                <div class="typing-dots"><span></span><span></span><span></span></div>
              } @else {
                <div class="bubble-text" [innerHTML]="formatMessage(msg.content)"></div>
                <div class="bubble-time">{{ msg.time | date:'HH:mm' }}</div>
              }
            </div>
          </div>
        }
      </div>

      @if (messages.length > 0 && !loading) {
        <div class="quick-actions">
          @for (q of quickQuestions; track q) {
            <button class="quick-chip" (click)="sendSuggestion(q)">{{ q }}</button>
          }
        </div>
      }

      <div class="input-area">
        <div class="input-wrapper">
          <textarea #inputField [(ngModel)]="userInput" (keydown)="onKeydown($event)"
            placeholder="Posez votre question sur vos dossiers..." rows="1"
            [disabled]="loading" class="chat-input"></textarea>
          <button class="send-btn" (click)="sendMessage()" [disabled]="!userInput.trim() || loading">
            @if (loading) { <span class="send-spinner"></span> } @else { ➤ }
          </button>
        </div>
        <p class="input-hint">Appuyez sur <kbd>Entrée</kbd> pour envoyer · <kbd>Shift+Entrée</kbd> pour nouvelle ligne</p>
      </div>
    </div>
  `,
  styles: [`
    .chatbot-page { display:flex; flex-direction:column; height:calc(100vh - 40px); max-width:860px; margin:0 auto; background:white; border-radius:var(--radius-xl); border:1px solid var(--gray-200); overflow:hidden; box-shadow:var(--shadow-lg); }
    .chat-header { display:flex; align-items:center; gap:14px; padding:16px 24px; background:linear-gradient(135deg,#0f172a,#1e3a5f); color:white; flex-shrink:0; }
    .bot-avatar { width:48px; height:48px; background:rgba(255,255,255,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; border:2px solid rgba(255,255,255,0.2); flex-shrink:0; }
    .bot-info { flex:1; }
    .bot-info h2 { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:600; margin-bottom:2px; }
    .bot-status { font-size:0.78rem; opacity:0.7; display:flex; align-items:center; gap:6px; }
    .status-dot { width:7px; height:7px; background:#10b981; border-radius:50%; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
    .clear-btn { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; border-radius:var(--radius); padding:6px 14px; font-size:0.78rem; font-weight:600; cursor:pointer; font-family:var(--font-sans); transition:all 0.15s; }
    .clear-btn:hover { background:rgba(255,255,255,0.2); }
    .messages-area { flex:1; overflow-y:auto; padding:24px 20px; display:flex; flex-direction:column; gap:16px; background:#f9fafb; }
    .messages-area::-webkit-scrollbar { width:4px; }
    .messages-area::-webkit-scrollbar-thumb { background:var(--gray-300); border-radius:2px; }
    .welcome-block { text-align:center; padding:20px; animation:fadeIn 0.4s ease; }
    .welcome-icon { font-size:3.5rem; margin-bottom:16px; }
    .welcome-block h3 { font-family:'Fraunces',serif; font-size:1.4rem; color:var(--gray-900); margin-bottom:8px; }
    .welcome-block p { color:var(--gray-500); font-size:0.9rem; margin-bottom:4px; }
    .welcome-sub { font-weight:600 !important; color:var(--gray-600) !important; margin-top:20px !important; margin-bottom:12px !important; }
    .suggestions-grid { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:8px; }
    .suggestion-chip { background:white; border:1.5px solid var(--primary-100); color:var(--primary); padding:8px 14px; border-radius:20px; font-size:0.82rem; font-weight:600; cursor:pointer; font-family:var(--font-sans); transition:all 0.15s; }
    .suggestion-chip:hover { background:var(--primary); color:white; border-color:var(--primary); transform:translateY(-1px); }
    .message-row { display:flex; align-items:flex-end; gap:10px; animation:slideUp 0.25s ease; }
    .message-row.user-row { flex-direction:row-reverse; }
    .bot-bubble-avatar { width:32px; height:32px; background:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; margin-bottom:2px; }
    .bubble { max-width:75%; padding:12px 16px; border-radius:var(--radius-lg); position:relative; }
    .bot-bubble { background:white; border:1px solid var(--gray-200); border-bottom-left-radius:4px; box-shadow:var(--shadow-sm); }
    .user-bubble { background:linear-gradient(135deg,var(--primary),var(--primary-light)); color:white; border-bottom-right-radius:4px; }
    .bubble-text { font-size:0.9rem; line-height:1.65; }
    .bubble-time { font-size:0.68rem; opacity:0.45; margin-top:6px; text-align:right; }
    .typing-dots { display:flex; gap:4px; padding:4px 2px; }
    .typing-dots span { width:7px; height:7px; background:var(--gray-400); border-radius:50%; animation:bounce 1.2s infinite; }
    .typing-dots span:nth-child(2) { animation-delay:0.2s; }
    .typing-dots span:nth-child(3) { animation-delay:0.4s; }
    @keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
    .quick-actions { padding:8px 20px 4px; display:flex; gap:6px; flex-wrap:wrap; background:#f9fafb; border-top:1px solid var(--gray-100); flex-shrink:0; }
    .quick-chip { background:white; border:1px solid var(--gray-200); color:var(--gray-600); padding:5px 12px; border-radius:16px; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:var(--font-sans); transition:all 0.15s; }
    .quick-chip:hover { border-color:var(--primary); color:var(--primary); }
    .input-area { padding:12px 20px 14px; border-top:1px solid var(--gray-200); background:white; flex-shrink:0; }
    .input-wrapper { display:flex; gap:10px; align-items:flex-end; }
    .chat-input { flex:1; border:1.5px solid var(--gray-200); border-radius:var(--radius-md); padding:10px 14px; font-size:0.9rem; font-family:var(--font-sans); resize:none; outline:none; max-height:120px; line-height:1.5; transition:border-color 0.15s; }
    .chat-input:focus { border-color:var(--primary); }
    .chat-input:disabled { background:var(--gray-50); }
    .send-btn { width:44px; height:44px; background:var(--primary); color:white; border:none; border-radius:var(--radius); font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; }
    .send-btn:hover:not(:disabled) { background:var(--primary-dark); transform:scale(1.05); }
    .send-btn:disabled { background:var(--gray-300); cursor:not-allowed; }
    .send-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.4); border-top-color:white; border-radius:50%; animation:spin 0.6s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .input-hint { font-size:0.7rem; color:var(--gray-400); margin-top:6px; text-align:center; }
    .input-hint kbd { background:var(--gray-100); padding:1px 5px; border-radius:4px; font-family:monospace; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none} }
    @keyframes slideUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
  `]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesArea') private messagesArea!: ElementRef;

  // ⚠️ APPEL BACKEND uniquement — plus d'appel direct à Anthropic/Groq
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  messages: Message[] = [];
  userInput = '';
  loading = false;
  prenom = '';
  shouldScroll = false;

  suggestions = [
    '📋 Liste de tous mes dossiers',
    '💰 Total remboursé cette année',
    '⏳ Dossiers en attente de traitement',
    '✅ Mes dossiers approuvés',
    '📅 Dossiers soumis ce mois-ci',
    '📊 Mon bilan de remboursement',
  ];

  quickQuestions = [
    '📋 Mes dossiers récents',
    '💰 Total remboursé',
    '⏳ En attente',
    '✅ Approuvés',
  ];

  ngOnInit() {
    this.prenom = this.auth.currentUser()?.prenom ?? 'Assuré';
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', content: text, time: new Date() });
    this.userInput = '';
    this.loading = true;
    this.shouldScroll = true;

    const loadingMsg: Message = { role: 'bot', content: '', time: new Date(), loading: true };
    this.messages.push(loadingMsg);

    // Historique pour le contexte (sans le message loading)
    const history = this.messages
      .filter(m => !m.loading && m.content)
      .slice(-10)
      .slice(0, -1) // exclure le dernier message user (déjà dans "message")
      .map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    // ✅ Appel au BACKEND Spring Boot (pas direct à Groq/Anthropic)
    this.http.post<any>(`${environment.apiUrl}/assure/chatbot`, {
      message: text,
      history: history
    }).subscribe({
      next: (res) => {
        const reply = res?.data || res?.message || 'Désolé, je n\'ai pas pu répondre.';
        const idx = this.messages.indexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = { role: 'bot', content: reply, time: new Date() };
        }
        this.loading = false;
        this.shouldScroll = true;
      },
      error: () => {
        const idx = this.messages.indexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = {
            role: 'bot',
            content: '⚠️ Impossible de contacter le serveur.<br>Vérifiez que le backend Spring Boot est démarré sur le port 8080.',
            time: new Date()
          };
        }
        this.loading = false;
        this.shouldScroll = true;
      }
    });
  }

  formatMessage(text: string): string {
    if (!text) return '';
    if (text.includes('<strong>') || text.includes('<ul>') || text.includes('<br>')) return text;
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  clearChat() { this.messages = []; }

  private scrollToBottom() {
    try {
      this.messagesArea.nativeElement.scrollTop = this.messagesArea.nativeElement.scrollHeight;
    } catch {}
  }
}

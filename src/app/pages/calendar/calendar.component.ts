import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-page container">
      <div class="page-header">
        <div class="header-text">
          <h1>Calendario Académico</h1>
          <p>Fechas importantes, feriados y horarios protegidos de la UCM.</p>
        </div>
        <div class="calendar-controls">
          <button class="btn btn-ghost" (click)="prevMonth()">◀ Anterior</button>
          <h2>{{ currentMonthName() }} {{ currentYear() }}</h2>
          <button class="btn btn-ghost" (click)="nextMonth()">Siguiente ▶</button>
        </div>
      </div>

      <div class="calendar-grid-container card">
        <div class="weekdays">
          <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
        </div>
        
        <div class="days-grid">
          <div *ngFor="let blank of blanks()" class="day-cell blank"></div>
          
          <div *ngFor="let day of daysInMonth()" 
               class="day-cell" 
               [class.today]="isToday(day)"
               (click)="openAddModal(day)">
            
            <div class="day-number">{{ day }}</div>
            
            <div class="events-container">
              <div *ngFor="let event of getEventsForDay(day)" 
                   class="event-pill" 
                   [ngClass]="'type-' + event.type"
                   (click)="handleEventClick($event, event)">
                {{ event.title }}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div class="legend-card card mt-4">
        <h3>Leyenda</h3>
        <div class="legend-items">
          <div class="legend-item"><span class="legend-dot type-academico"></span> Hito Académico</div>
          <div class="legend-item"><span class="legend-dot type-feriado"></span> Feriado</div>
          <div class="legend-item"><span class="legend-dot type-horario_protegido"></span> Horario Protegido</div>
        </div>
      </div>

      <!-- Add Event Modal -->
      <div class="modal-backdrop" *ngIf="showModal()" (click)="showModal.set(false)">
        <div class="modal card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingEvent() ? 'Editar' : 'Agregar' }} Evento</h2>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p><strong>Fecha:</strong> {{ selectedDateStr() }}</p>
            
            <div class="form-group">
              <label>Título del Evento</label>
              <input type="text" class="input-field" [(ngModel)]="newEvent.title" placeholder="Ej: Inicio de clases">
            </div>
            
            <div class="form-group">
              <label>Tipo de Evento</label>
              <select class="input-field" [(ngModel)]="newEvent.type">
                <option value="academico">Hito Académico</option>
                <option value="feriado">Feriado</option>
                <option value="horario_protegido">Horario Protegido</option>
              </select>
            </div>
          </div>
          <div class="modal-footer" style="justify-content: space-between;">
            <button class="btn btn-ghost text-danger" *ngIf="editingEvent()" (click)="deleteEvent()">Eliminar Evento</button>
            <div style="flex:1"></div>
            <button class="btn btn-ghost" (click)="showModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="saveEvent()" [disabled]="!newEvent.title || saving()">
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-page { padding-top: calc(var(--navbar-height) + var(--space-xl)); padding-bottom: var(--space-xl); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-xl); flex-wrap: wrap; gap: var(--space-md); }
    .header-text h1 { font-size: 2.2rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px; }
    .header-text p { color: var(--color-text-muted); font-size: 1.05rem; }
    
    .calendar-controls { display: flex; align-items: center; gap: var(--space-md); }
    .calendar-controls h2 { font-size: 1.25rem; font-weight: 700; min-width: 180px; text-align: center; text-transform: capitalize; margin: 0; }
    
    .calendar-grid-container { padding: 0; overflow: hidden; }
    .weekdays { display: grid; grid-template-columns: repeat(7, 1fr); background: var(--color-bg-alt); text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border-light); }
    .weekdays div { padding: 12px 0; }
    
    .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(100px, auto); }
    .day-cell { border-right: 1px solid var(--color-border-light); border-bottom: 1px solid var(--color-border-light); padding: 8px; cursor: pointer; transition: background 0.2s; display: flex; flex-direction: column; }
    .day-cell:nth-child(7n) { border-right: none; }
    .day-cell:hover:not(.blank) { background: var(--color-bg-alt); }
    .day-cell.blank { background: rgba(0,0,0,0.02); cursor: default; }
    .day-cell.today { background: rgba(59, 130, 246, 0.05); }
    .day-cell.today .day-number { background: var(--color-primary); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    
    .day-number { font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; align-self: flex-start; }
    
    .events-container { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .event-pill { font-size: 0.7rem; padding: 3px 6px; border-radius: 4px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    /* Colors for event types */
    .type-academico { background: rgba(59, 130, 246, 0.15); color: #1d4ed8; }
    .type-feriado { background: rgba(239, 68, 68, 0.15); color: #b91c1c; }
    .type-horario_protegido { background: rgba(139, 92, 246, 0.15); color: #6d28d9; }
    
    .legend-card { padding: var(--space-md) var(--space-lg); }
    .legend-card h3 { font-size: 1rem; margin-bottom: var(--space-sm); font-weight: 700; }
    .legend-items { display: flex; flex-wrap: wrap; gap: var(--space-lg); }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 500; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    
    .mt-4 { margin-top: var(--space-lg); }
    .text-danger { color: #ef4444 !important; }
    
    /* Modal styles */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: var(--space-md); backdrop-filter: blur(4px); }
    .modal { width: 100%; max-width: 400px; display: flex; flex-direction: column; }
    .modal-header { padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--color-border-light); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); }
    .modal-body { padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
    .modal-footer { padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--color-border-light); display: flex; gap: var(--space-sm); background: var(--color-bg-alt); }
    
    @media(max-width: 768px) {
      .weekdays div { font-size: 0.75rem; padding: 8px 0; }
      .days-grid { grid-auto-rows: minmax(70px, auto); }
      .day-cell { padding: 4px; }
      .event-pill { font-size: 0.65rem; padding: 2px 4px; }
    }
  `]
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  
  // Grid data
  daysInMonth = signal<number[]>([]);
  blanks = signal<number[]>([]);
  
  // Events
  events = signal<CalendarEvent[]>([]);
  
  // Modal state
  showModal = signal(false);
  saving = signal(false);
  selectedDate: Date | null = null;
  selectedDateStr = signal('');
  
  // Form state
  editingEvent = signal<string | null>(null);
  newEvent = { title: '', type: 'academico' };

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  ngOnInit() {
    this.currentDate = new Date(); // Start at current date
    this.updateCalendarGrid();
    this.loadEvents();
  }

  isModerator(): boolean {
    return !!this.auth.profile()?.is_moderator;
  }

  // --- Calendar Logic ---
  
  updateCalendarGrid() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    let firstDay = new Date(year, month, 1).getDay();
    // Convert to Monday-start (0 = Mon, 6 = Sun)
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = new Date(year, month + 1, 0).getDate();
    
    this.blanks.set(Array(firstDay).fill(0));
    this.daysInMonth.set(Array.from({length: days}, (_, i) => i + 1));
  }
  
  currentMonthName(): string {
    return this.currentDate.toLocaleDateString('es-ES', { month: 'long' });
  }
  
  currentYear(): number {
    return this.currentDate.getFullYear();
  }
  
  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCalendarGrid();
    this.loadEvents();
  }
  
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCalendarGrid();
    this.loadEvents();
  }
  
  isToday(day: number): boolean {
    const today = new Date();
    return this.currentDate.getFullYear() === today.getFullYear() &&
           this.currentDate.getMonth() === today.getMonth() &&
           day === today.getDate();
  }

  // --- Events Logic ---
  
  async loadEvents() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1; // 1-12
    const startStr = \`\${year}-\${month.toString().padStart(2, '0')}-01\`;
    const endStr = \`\${year}-\${month.toString().padStart(2, '0')}-\${new Date(year, month, 0).getDate()}\`;
    
    const { data } = await this.supabase.client
      .from('calendar_events')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true });
      
    if (data) {
      this.events.set(data as CalendarEvent[]);
    }
  }
  
  getEventsForDay(day: number): CalendarEvent[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    const dateStr = \`\${year}-\${month.toString().padStart(2, '0')}-\${day.toString().padStart(2, '0')}\`;
    
    return this.events().filter(e => e.date === dateStr);
  }

  // --- Modal Logic ---

  openAddModal(day: number) {
    if (!this.isModerator()) return;
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.selectedDate = new Date(year, month, day);
    
    this.selectedDateStr.set(this.selectedDate.toLocaleDateString('es-ES', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }));
    
    this.editingEvent.set(null);
    this.newEvent = { title: '', type: 'academico' };
    this.showModal.set(true);
  }

  handleEventClick(e: Event, event: CalendarEvent) {
    if (!this.isModerator()) return;
    e.stopPropagation(); // Prevent triggering cell click
    
    // Convert string 'YYYY-MM-DD' back to Date safely
    const [y, m, d] = event.date.split('-');
    this.selectedDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
    this.selectedDateStr.set(this.selectedDate.toLocaleDateString('es-ES', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }));
    
    this.editingEvent.set(event.id);
    this.newEvent = { title: event.title, type: event.type };
    this.showModal.set(true);
  }

  async saveEvent() {
    if (!this.newEvent.title || !this.selectedDate) return;
    
    this.saving.set(true);
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth() + 1;
    const day = this.selectedDate.getDate();
    const dateStr = \`\${year}-\${month.toString().padStart(2, '0')}-\${day.toString().padStart(2, '0')}\`;
    
    try {
      if (this.editingEvent()) {
        await this.supabase.client.from('calendar_events')
          .update({ title: this.newEvent.title, type: this.newEvent.type })
          .eq('id', this.editingEvent());
      } else {
        await this.supabase.client.from('calendar_events').insert({
          title: this.newEvent.title,
          type: this.newEvent.type,
          date: dateStr,
          created_by: this.auth.profile()?.id
        });
      }
      
      this.showModal.set(false);
      this.loadEvents();
    } catch (e) {
      console.error(e);
      alert('Error guardando evento');
    } finally {
      this.saving.set(false);
    }
  }
  
  async deleteEvent() {
    if (!this.editingEvent() || !confirm('¿Eliminar este evento?')) return;
    
    try {
      await this.supabase.client.from('calendar_events').delete().eq('id', this.editingEvent());
      this.showModal.set(false);
      this.loadEvents();
    } catch(e) {
      console.error(e);
    }
  }
}

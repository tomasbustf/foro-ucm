import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-conduct-rules',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="legal-page container">
      <div class="card legal-card">
        <h1>Normas de Uso y Conducta</h1>
        <h2>Foro Estudiantil Digital – Universidad Católica del Maule</h2>
        <p><strong>Última actualización:</strong> Julio 2026</p>

        <p>Estas Normas complementan los Términos y Condiciones y la Política de Privacidad del Foro, y establecen las reglas de convivencia dentro de la comunidad. Su objetivo es mantener un espacio útil, confiable y respetuoso para todos los estudiantes de la UCM.</p>

        <h3>1. Principio base: identidad real</h3>
        <p>En este Foro <strong>no existe el anonimato</strong>. Cada publicación, comentario o valoración queda asociada a tu nombre y correo institucional, visibles para el resto de la comunidad. Esto implica que:</p>
        <ul>
          <li>Eres responsable de todo lo que publiques.</li>
          <li>Debes tratar a los demás con el mismo respeto que esperarías recibir, sabiendo que quien lee tu publicación puede identificarte.</li>
          <li>No está permitido crear cuentas falsas ni suplantar la identidad de otra persona.</li>
        </ul>

        <h3>2. Contenido permitido y bienvenido</h3>
        <ul>
          <li>Material de estudio, apuntes y guías de asignaturas.</li>
          <li>Preguntas y respuestas sobre trámites, becas, horarios y vida universitaria.</li>
          <li>Opiniones y valoraciones fundamentadas sobre ramos o metodologías docentes (enfocadas en la experiencia académica, no en la persona).</li>
          <li>Avisos verificados sobre contingencias del campus (suspensiones, cambios de horario, eventos).</li>
        </ul>

        <h3>3. Contenido y conductas prohibidas</h3>
        <p>No está permitido publicar contenido que:</p>
        <ol>
          <li><strong>Constituya acoso, insultos o discurso de odio</strong> hacia estudiantes, docentes o funcionarios, incluyendo comentarios discriminatorios por género, orientación sexual, nacionalidad, religión, condición socioeconómica o cualquier otra condición.</li>
          <li><strong>Difame o dañe injustificadamente la reputación</strong> de una persona, presentando opiniones personales como si fueran hechos comprobados.</li>
          <li><strong>Difunda información falsa</strong> a sabiendas (por ejemplo, avisos inventados de suspensión de clases).</li>
          <li>Incluya <strong>spam, publicidad no académica</strong> o enlaces a sitios externos no verificados.</li>
          <li>Contenga <strong>material con derechos de autor</strong> sin autorización (por ejemplo, apuntes o materiales de propiedad exclusiva de terceros sin permiso de compartirlos).</li>
          <li>Exponga <strong>datos personales de terceros</strong> sin su consentimiento (por ejemplo, números de teléfono o direcciones de otros estudiantes).</li>
          <li>Promueva actividades ilícitas dentro o fuera de la Universidad.</li>
        </ol>

        <h3>4. Sobre las valoraciones de docentes y asignaturas</h3>
        <p>Las opiniones sobre docentes y ramos deben:</p>
        <ul>
          <li>Enfocarse en la experiencia académica (metodología, exigencia, claridad, evaluaciones), no en juicios sobre la persona del docente.</li>
          <li>Evitar lenguaje ofensivo, descalificaciones o ataques personales.</li>
          <li>Estar fundamentadas en tu experiencia real como estudiante del ramo o curso comentado.</li>
        </ul>

        <h3>5. Moderación</h3>
        <p>5.1. El contenido reportado por la comunidad o detectado por el equipo administrador será revisado conforme a estas Normas.</p>
        <p>5.2. Ante una infracción, se podrán aplicar las siguientes medidas, de forma escalonada según la gravedad:</p>
        <ul>
          <li><strong>Advertencia</strong> al usuario y/o eliminación del contenido infractor.</li>
          <li><strong>Suspensión temporal</strong> de la cuenta.</li>
          <li><strong>Eliminación definitiva</strong> de la cuenta, en casos graves o de reiteración.</li>
        </ul>
        <p>5.3. En infracciones que puedan constituir faltas a la normativa interna de la UCM o a la legislación vigente, la situación podrá ser derivada a las instancias institucionales correspondientes.</p>

        <h3>6. Cómo reportar contenido</h3>
        <p>Si encuentras una publicación que incumple estas Normas, puedes reportarla usando la función de reporte del Foro (o escribiendo a [correo de contacto del equipo]), indicando el motivo del reporte.</p>

        <h3>7. Espíritu de la comunidad</h3>
        <p>El Foro existe para resolver un problema real: la dispersión y falta de confiabilidad de la información entre estudiantes UCM. Su éxito depende de que cada integrante de la comunidad aporte información útil, veraz y respetuosa. Usa el Foro como te gustaría que otros lo usaran contigo.</p>

        <div class="legal-actions">
          <a routerLink="/" class="btn btn-primary">Volver al inicio</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal-page { padding-top: calc(var(--navbar-height) + var(--space-xl)); padding-bottom: var(--space-xl); max-width: 800px; }
    .legal-card { padding: var(--space-xl); line-height: 1.6; color: var(--color-text); }
    .legal-card h1 { font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: 5px; }
    .legal-card h2 { font-size: 1.2rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-md); }
    .legal-card h3 { font-size: 1.3rem; font-weight: 700; color: var(--color-primary); margin-top: var(--space-lg); margin-bottom: var(--space-sm); border-bottom: 1px solid var(--color-border-light); padding-bottom: 5px; }
    .legal-card p { margin-bottom: var(--space-md); }
    .legal-card ul, .legal-card ol { margin-bottom: var(--space-md); padding-left: 20px; }
    .legal-card li { margin-bottom: 5px; }
    .legal-actions { margin-top: var(--space-xl); display: flex; justify-content: center; }
  `]
})
export class ConductRulesComponent {}

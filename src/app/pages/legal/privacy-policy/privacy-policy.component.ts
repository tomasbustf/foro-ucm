import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="legal-page container">
      <div class="card legal-card">
        <h1>Política de Privacidad</h1>
        <h2>Foro Estudiantil Digital – Universidad Católica del Maule</h2>
        <p><strong>Última actualización:</strong> Julio 2026</p>

        <p>Esta Política de Privacidad describe cómo el Foro Estudiantil Digital (en adelante, "el Foro"), desarrollado como proyecto de investigación de la carrera de Ingeniería Civil Informática de la UCM, recopila, utiliza, almacena y protege los datos personales de sus usuarios.</p>

        <h3>1. Responsable del tratamiento de datos</h3>
        <p>El tratamiento de los datos personales recopilados en esta Plataforma es realizado por el equipo estudiantil desarrollador del proyecto, bajo la supervisión académica de la asignatura Metodología de la Investigación de la UCM. Para efectos de esta política, se le denominará "el Responsable".</p>

        <h3>2. Datos personales que se recopilan</h3>
        <p>El Foro recopila únicamente los datos necesarios para el funcionamiento del servicio:</p>
        <ul>
          <li><strong>Datos de registro:</strong> nombre completo y correo electrónico institucional de la UCM.</li>
          <li><strong>Contenido generado por el usuario:</strong> publicaciones, comentarios, valoraciones y cualquier otro contenido que decida compartir en la Plataforma.</li>
          <li><strong>Datos técnicos básicos:</strong> fecha y hora de las publicaciones, y registros de actividad necesarios para el funcionamiento y moderación del Foro (por ejemplo, mediante los servicios de autenticación y base de datos de Supabase).</li>
        </ul>
        <p>El Foro <strong>no solicita</strong> contraseñas de otros servicios, datos bancarios, ni información sensible (salud, RUT, datos biométricos, etc.).</p>

        <h3>3. Finalidad del tratamiento de los datos</h3>
        <p>Los datos se utilizan exclusivamente para:</p>
        <ul>
          <li>Verificar la condición de estudiante regular de la UCM mediante el correo institucional.</li>
          <li>Permitir la identificación real de los usuarios en sus publicaciones, como mecanismo de moderación y confiabilidad de la información compartida.</li>
          <li>Habilitar las funcionalidades del Foro (publicar, comentar, valorar, recibir notificaciones).</li>
          <li>Generar estadísticas agregadas y anónimas con fines de evaluación académica del proyecto de investigación.</li>
        </ul>

        <h3>4. Ausencia de anonimato: tratamiento especial</h3>
        <p>El Foro fue diseñado <strong>sin opción de anonimato</strong>: el nombre y correo institucional del usuario serán visibles junto a cada publicación, comentario o valoración que realice dentro de la comunidad de usuarios registrados. Al registrarte, aceptas expresamente esta condición de visibilidad, entendiendo que su propósito es fomentar la responsabilidad en el uso de la Plataforma y facilitar la moderación del contenido.</p>

        <h3>5. Base legal y consentimiento</h3>
        <p>El tratamiento de tus datos se basa en el <strong>consentimiento expreso</strong> que otorgas al momento de registrarte, aceptando estos Términos y esta Política. Puedes retirar tu consentimiento en cualquier momento solicitando la eliminación de tu cuenta (ver sección 8).</p>

        <h3>6. Almacenamiento y seguridad</h3>
        <p>6.1. Los datos se almacenan en una base de datos relacional (PostgreSQL) gestionada a través de Supabase, plataforma que provee mecanismos de autenticación y controles de acceso.</p>
        <p>6.2. El equipo desarrollador implementa medidas razonables para proteger la información contra accesos no autorizados, pérdida o alteración, dentro de las capacidades de un proyecto académico sin financiamiento externo.</p>
        <p>6.3. Al ser un prototipo de investigación, el usuario debe considerar que los estándares de seguridad son los propios de un entorno experimental y no de un sistema productivo de nivel institucional.</p>

        <h3>7. Compartición de datos con terceros</h3>
        <p>El Foro <strong>no vende ni comparte</strong> los datos personales de sus usuarios con terceros ajenos al proyecto de investigación. Los datos solo podrán ser conocidos por:</p>
        <ul>
          <li>El equipo desarrollador del proyecto, para fines de administración y moderación.</li>
          <li>La docente responsable de la asignatura, exclusivamente con fines de evaluación académica.</li>
          <li>Las autoridades competentes, si así lo exige la ley.</li>
        </ul>

        <h3>8. Derechos del usuario</h3>
        <p>Todo usuario puede ejercer, en cualquier momento y contactando al equipo desarrollador, los siguientes derechos sobre sus datos:</p>
        <ul>
          <li><strong>Acceso:</strong> conocer qué datos suyos están almacenados.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados.</li>
          <li><strong>Eliminación:</strong> solicitar la baja de su cuenta y la eliminación de sus datos personales de registro.</li>
          <li><strong>Oposición:</strong> oponerse a un tratamiento específico de sus datos.</li>
        </ul>
        <p>Nota: la eliminación de la cuenta no implica necesariamente la eliminación retroactiva de publicaciones ya compartidas con la comunidad, salvo que se solicite expresamente, dado el interés de mantener la integridad del historial de información del Foro.</p>
        <p>Solicitudes a: [correo de contacto del equipo]</p>

        <h3>9. Conservación de los datos</h3>
        <p>Los datos se conservarán mientras la cuenta del usuario permanezca activa y mientras dure el proyecto de investigación. Al finalizar la etapa experimental del proyecto, los datos podrán ser eliminados o anonimizados, salvo que se defina la continuidad institucional de la Plataforma.</p>

        <h3>10. Menores de edad</h3>
        <p>Este servicio está dirigido a estudiantes regulares de educación superior de la UCM. No está diseñado para ser usado por menores de 18 años fuera de dicho contexto.</p>

        <h3>11. Cambios a esta política</h3>
        <p>Esta Política podrá actualizarse a medida que el proyecto evolucione, incluyendo adecuaciones a la normativa chilena de protección de datos personales vigente. Se notificará cualquier cambio relevante a los usuarios registrados mediante su correo institucional.</p>

        <h3>12. Contacto</h3>
        <p>Para consultas o ejercer tus derechos sobre tus datos personales, escribe a: [correo de contacto del equipo]</p>

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
    .legal-card ul { margin-bottom: var(--space-md); padding-left: 20px; }
    .legal-card li { margin-bottom: 5px; }
    .legal-actions { margin-top: var(--space-xl); display: flex; justify-content: center; }
  `]
})
export class PrivacyPolicyComponent {}

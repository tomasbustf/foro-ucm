import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="legal-page container">
      <div class="card legal-card">
        <h1>Términos y Condiciones de Uso</h1>
        <h2>Foro Estudiantil Digital – Universidad Católica del Maule</h2>
        <p><strong>Última actualización:</strong> Julio 2026</p>

        <p>Bienvenido/a al Foro Estudiantil Digital de la Universidad Católica del Maule (en adelante, "el Foro" o "la Plataforma"). Al registrarte y utilizar este servicio, aceptas los presentes Términos y Condiciones de Uso. Si no estás de acuerdo con ellos, no debes registrarte ni utilizar la Plataforma.</p>
        
        <p>Este proyecto corresponde a una iniciativa desarrollada en el marco de la asignatura Metodología de la Investigación, de la carrera de Ingeniería Civil Informática de la UCM, y se encuentra en fase de investigación y prototipado.</p>

        <h3>1. Descripción del servicio</h3>
        <p>El Foro es un espacio digital colaborativo dirigido a estudiantes regulares de la UCM, cuyo objetivo es centralizar información académica y de la vida universitaria: material de estudio, orientación entre pares, opiniones sobre asignaturas y docentes, y avisos sobre contingencias del campus (suspensiones de clases, trámites, becas, eventos, entre otros).</p>

        <h3>2. Requisitos de registro</h3>
        <p>2.1. Para crear una cuenta, el usuario debe registrarse <strong>exclusivamente con su correo electrónico institucional de la UCM</strong>.</p>
        <p>2.2. El registro con correos personales, ajenos o de terceros no está permitido. La Plataforma podrá suspender o eliminar cuentas que incumplan esta condición.</p>
        <p>2.3. Al registrarte, declaras que la información entregada (nombre y correo institucional) es veraz y te pertenece.</p>

        <h3>3. Identificación real de los usuarios</h3>
        <p>3.1. El Foro <strong>no permite el anonimato</strong>. Todas las publicaciones, comentarios y valoraciones quedarán asociadas al nombre y correo institucional del usuario que las emite, y serán visibles para el resto de la comunidad registrada.</p>
        <p>3.2. Esta condición busca fomentar un uso responsable de la Plataforma y facilitar la moderación del contenido publicado.</p>
        <p>3.3. El usuario es el único responsable del contenido que publica bajo su identidad.</p>

        <h3>4. Uso aceptable de la plataforma</h3>
        <p>El usuario se compromete a:</p>
        <ul>
          <li>Utilizar el Foro con fines académicos y de convivencia universitaria.</li>
          <li>Publicar contenido veraz, respetuoso y pertinente a las categorías habilitadas.</li>
          <li>No suplantar la identidad de otro estudiante, docente o funcionario.</li>
          <li>No compartir contenido con derechos de autor sin autorización.</li>
        </ul>

        <h3>5. Conductas prohibidas</h3>
        <p>Queda estrictamente prohibido publicar contenido que:</p>
        <ul>
          <li>Constituya acoso, discriminación, difamación o discurso de odio hacia cualquier persona.</li>
          <li>Contenga información falsa presentada como verídica (desinformación).</li>
          <li>Incluya spam, publicidad no autorizada o enlaces maliciosos.</li>
          <li>Vulnere la normativa interna de la Universidad o la legislación chilena vigente.</li>
        </ul>
        <p>Para el detalle completo de conductas esperadas y sancionables, revisa las <strong>Normas de Uso y Conducta</strong> de la Plataforma.</p>

        <h3>6. Moderación y sanciones</h3>
        <p>6.1. El equipo administrador podrá revisar, ocultar o eliminar contenido que infrinja estos Términos, así como advertir, suspender o eliminar cuentas de usuarios reincidentes.</p>
        <p>6.2. Dado que las publicaciones están vinculadas a la identidad real del usuario, las infracciones graves podrán ser derivadas a las instancias correspondientes de la Universidad, cuando así lo determine la normativa institucional.</p>

        <h3>7. Propiedad del contenido</h3>
        <p>7.1. El usuario conserva la titularidad del contenido original que publica, pero otorga al Foro una licencia no exclusiva para almacenarlo, mostrarlo y distribuirlo dentro de la Plataforma con fines del servicio.</p>
        <p>7.2. El Foro no se hace responsable por el contenido publicado por los usuarios, sin perjuicio de las labores de moderación señaladas en la sección 6.</p>

        <h3>8. Naturaleza del proyecto y disponibilidad del servicio</h3>
        <p>Al tratarse de un prototipo desarrollado con fines de investigación académica, el equipo desarrollador no garantiza disponibilidad continua, permanencia indefinida del servicio ni ausencia total de errores técnicos. La Plataforma podrá ser modificada, suspendida o discontinuada sin previo aviso mientras se encuentre en etapa experimental.</p>

        <h3>9. Limitación de responsabilidad</h3>
        <p>El Foro y su equipo desarrollador no serán responsables por daños derivados del uso o imposibilidad de uso de la Plataforma, ni por la exactitud de las opiniones, valoraciones o información publicada por los usuarios.</p>

        <h3>10. Modificaciones</h3>
        <p>Estos Términos pueden ser actualizados. Se notificará a los usuarios registrados ante cambios relevantes mediante el correo institucional asociado a su cuenta.</p>

        <h3>11. Legislación aplicable</h3>
        <p>Estos Términos se rigen por la legislación de la República de Chile.</p>

        <h3>12. Contacto</h3>
        <p>Para consultas sobre estos Términos, puedes escribir a: [correo de contacto del equipo]</p>

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
export class TermsComponent {}

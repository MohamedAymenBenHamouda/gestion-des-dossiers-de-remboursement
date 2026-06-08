import { Pipe, PipeTransform } from '@angular/core';
import { DossierStatus, AIValidationStatus } from '../../core/models/models';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: DossierStatus | AIValidationStatus): string {
    const labels: Record<string, string> = {
      BROUILLON: 'Brouillon',
      SOUMIS: 'Soumis',
      EN_COURS: 'En cours',
      INCOMPLET: 'Incomplet',
      APPROUVE: 'Approuvé',
      REJETE: 'Rejeté',
      EN_ATTENTE: 'En attente',
      VALIDE: 'Validé',
      INVALIDE: 'Invalide',
      ERREUR: 'Erreur',
    };
    return labels[status] ?? status;
  }
}

@Pipe({ name: 'statusClass', standalone: true })
export class StatusClassPipe implements PipeTransform {
  transform(status: DossierStatus | AIValidationStatus): string {
    const classes: Record<string, string> = {
      BROUILLON: 'badge badge-gray',
      SOUMIS: 'badge badge-primary',
      EN_COURS: 'badge badge-info',
      INCOMPLET: 'badge badge-warning',
      APPROUVE: 'badge badge-success',
      REJETE: 'badge badge-danger',
      EN_ATTENTE: 'badge badge-gray',
      VALIDE: 'badge badge-success',
      INVALIDE: 'badge badge-danger',
      ERREUR: 'badge badge-danger',
    };
    return classes[status] ?? 'badge badge-gray';
  }
}

@Pipe({ name: 'docTypeLabel', standalone: true })
export class DocTypeLabelPipe implements PipeTransform {
  transform(type: string): string {
    const labels: Record<string, string> = {
      VISITE_MEDICALE: '🩺 Visite médicale',
      ORDONNANCE: '💊 Ordonnance',
      ANALYSE: '🔬 Analyse',
      SCANNER: '🖥️ Scanner',
      RADIO: '📸 Radiographie',
      AUTRE: '📄 Autre',
    };
    return labels[type] ?? type;
  }
}

@Pipe({ name: 'currency2', standalone: true })
export class Currency2Pipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    if (value == null) return '-';
    return `${value.toFixed(2)} TND`;
  }
}

@Pipe({ name: 'shortDate', standalone: true })
export class ShortDatePipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-TN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

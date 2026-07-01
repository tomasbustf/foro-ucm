import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `hace ${weeks}sem`;
    const months = Math.floor(days / 30);
    if (months < 12) return `hace ${months}mes${months > 1 ? 'es' : ''}`;
    const years = Math.floor(days / 365);
    return `hace ${years}año${years > 1 ? 's' : ''}`;
  }
}

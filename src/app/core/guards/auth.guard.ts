import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Waits for auth loading to complete before checking.
 * Prevents false redirects on page refresh.
 */
function waitForAuth(auth: AuthService): Promise<void> {
  return new Promise((resolve) => {
    if (!auth.loading()) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (!auth.loading()) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForAuth(auth);

  if (auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/auth/login']);
  return false;
};

export const moderatorGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForAuth(auth);

  if (auth.isModerator()) {
    return true;
  }
  router.navigate(['/home']);
  return false;
};

/**
 * Inverse guard: only allows access if the user is NOT authenticated.
 * Redirects authenticated users to /home (e.g. for login/register pages).
 */
export const noAuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForAuth(auth);

  if (!auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/home']);
  return false;
};


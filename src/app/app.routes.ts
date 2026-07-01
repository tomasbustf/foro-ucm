import { Routes } from '@angular/router';
import { authGuard, moderatorGuard } from './core/guards/auth.guard';

// Import components directly to avoid lazy loading issues in this simplified setup
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { PostDetailComponent } from './pages/post-detail/post-detail.component';
import { NewPostComponent } from './pages/new-post/new-post.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { CategoryDetailComponent } from './pages/category-detail/category-detail.component';
import { MaterialsComponent } from './pages/materials/materials.component';
import { UploadMaterialComponent } from './pages/upload-material/upload-material.component';
import { NewsComponent } from './pages/news/news.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { CommunitiesComponent } from './pages/communities/communities.component';
import { MyProfileComponent } from './pages/my-profile/my-profile.component';
import { SearchComponent } from './pages/search/search.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { AdminComponent } from './pages/admin/admin.component';
import { FlyersComponent } from './pages/flyers/flyers.component';

import { PrivacyPolicyComponent } from './pages/legal/privacy-policy/privacy-policy.component';
import { TermsComponent } from './pages/legal/terms/terms.component';
import { ConductRulesComponent } from './pages/legal/conduct-rules/conduct-rules.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'post/:id', component: PostDetailComponent, canActivate: [authGuard] },
  { path: 'new-post', component: NewPostComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'category/:slug', component: CategoryDetailComponent, canActivate: [authGuard] },
  { path: 'materials', component: MaterialsComponent, canActivate: [authGuard] },
  { path: 'upload-material', component: UploadMaterialComponent, canActivate: [authGuard] },
  { path: 'my-profile', component: MyProfileComponent, canActivate: [authGuard] },
  { path: 'search', component: SearchComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'flyers', component: FlyersComponent, canActivate: [authGuard] },
  { path: 'news', component: NewsComponent, canActivate: [authGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
  { path: 'communities', component: CommunitiesComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, moderatorGuard] },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms-and-conditions', component: TermsComponent },
  { path: 'conduct-rules', component: ConductRulesComponent },
  { path: '**', redirectTo: '' }
];

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module'; // ensures the application have routing capabilities

import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'; // enables the application to communicate with the backend services
import { AuthInterceptorService } from './auth-interceptor.service'; // this will allow the app to automatically attach authorization information to requests
import { HomeComponent } from './home/home.component'; // implements the home route
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { RssItemsComponent } from './rss-items/rss-items.component';
import { HtmlspecialcharsdecodePipe } from './htmlspecialcharsdecode.pipe';
import { HtmlspecialcharsPipe } from './htmlspecialchars.pipe';
import { GmdatePipe } from './gmdate.pipe';
import { Nl2brPipe } from './nl2br.pipe';
import { NgxBootstrapIconsModule, allIcons } from 'ngx-bootstrap-icons';
import { LinktargetPipe } from './linktarget.pipe';
import {AuthGuardService} from "./_services/auth-guard.service";


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    ProfileComponent,
    RssItemsComponent,
    HtmlspecialcharsdecodePipe,
    HtmlspecialcharsPipe,
    GmdatePipe,
    Nl2brPipe,
    LinktargetPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgxBootstrapIconsModule.pick(allIcons)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true },
    AuthGuardService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

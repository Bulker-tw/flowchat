import { bootstrap } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { ChatPracticeUiAppComponent, environment } from './app/';
import {HTTP_PROVIDERS} from '@angular/http';
import { ROUTER_PROVIDERS } from '@angular/router-deprecated';



if (environment.production) {
  enableProdMode();
}

bootstrap(ChatPracticeUiAppComponent, [HTTP_PROVIDERS, ROUTER_PROVIDERS]);

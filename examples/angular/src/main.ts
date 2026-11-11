import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import defaultManifestJSON from '@stet-css/preset/default-manifest.json';
import CSSRuntime from '@stet-css/runtime';
import type { MasterCSSManifest } from '@stet-css/runtime';

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest;

CSSRuntime.create({ manifest: defaultManifest }).observe();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

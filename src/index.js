import angular from 'angular';
import { twMerge } from 'tailwind-merge';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';

import './core/core.module.js';
import './core/tv/tv.service.js';
import './core/overlay/overlay-stack.service.js';
import './core/overlay/floating-position.directive.js';
import './core/overlay/focus-trap.directive.js';
import './core/overlay/hotkey.directive.js';
import './core/id/id.service.js';
import './core/color-mode/color-mode.service.js';
import './components/layout/layout.module.js';
import './components/element/element.module.js';
import './components/components.module.js';
import './components/layout/app/app.component.js';
import './components/layout/container/container.theme.js';
import './components/layout/container/container.component.js';
import './components/layout/error/error.theme.js';
import './components/layout/error/error.component.js';
import './components/layout/footer/footer.theme.js';
import './components/layout/footer/footer.component.js';
import './components/layout/header/header.theme.js';
import './components/layout/header/header.component.js';
import './components/layout/main/main.theme.js';
import './components/layout/main/main.component.js';
import './components/layout/sidebar/sidebar.theme.js';
import './components/layout/sidebar/sidebar.component.js';
import './components/layout/theme/theme.component.js';
import './components/element/alert/alert.theme.js';
import './components/element/alert/alert.component.js';
import './components/element/avatar/avatar.theme.js';
import './components/element/avatar/avatar.component.js';
import './components/element/avatar-group/avatar-group.theme.js';
import './components/element/avatar-group/avatar-group.component.js';
import './components/element/badge/badge.theme.js';
import './components/element/badge/badge.component.js';
import './components/element/banner/banner.theme.js';
import './components/element/banner/banner.component.js';
import './components/element/button/button.theme.js';
import './components/element/button/button.component.js';
import './components/element/calendar/calendar.theme.js';
import './components/element/calendar/calendar.component.js';
import './gravity-elements.module.js';

// geTv (core/tv/tv.service.js) lê window.twMerge em tempo de execução para
// deduplicar classes Tailwind conflitantes (especificação técnica, seção 6).
// Sem isto, o bundle publicado nunca fazia merge de verdade — só o shim de
// teste do Karma (test/shims/tw-merge-export.js) setava esse global, então
// a suíte passava mas o pacote publicado degradava silenciosamente para
// "sem merge" (identityMerge em tv.service.js). Setar aqui, no único ponto
// que já é módulo ES e que o Karma não carrega (test/karma.conf.js exclui
// src/index.js), corrige o bundle sem tocar nos testes existentes. Roda antes
// de qualquer $onInit de componente, porque a avaliação deste módulo termina
// bem antes de qualquer angular.bootstrap() do app consumidor.
//
// geCalendar lê window.dateFns (mesmo padrão $window.focusTrap). No Karma o
// global vem de date-fns/cdn.js; no UMD publicado setamos o subconjunto usado.
if (typeof window !== 'undefined') {
  window.twMerge = twMerge;
  window.dateFns = {
    addDays: addDays,
    addMonths: addMonths,
    eachDayOfInterval: eachDayOfInterval,
    endOfMonth: endOfMonth,
    endOfWeek: endOfWeek,
    format: format,
    isAfter: isAfter,
    isBefore: isBefore,
    isSameDay: isSameDay,
    isSameMonth: isSameMonth,
    isToday: isToday,
    startOfMonth: startOfMonth,
    startOfWeek: startOfWeek,
    locale: {
      enUS: enUS,
      ptBR: ptBR,
    },
  };
}

export default angular.module('gravityElements');

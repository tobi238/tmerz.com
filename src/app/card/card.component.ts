import { Component, AfterViewInit } from '@angular/core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faXing } from '@fortawesome/free-brands-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent implements AfterViewInit {
  faEnvelope = faEnvelope;
  faXing = faXing;
  faLinkedin = faLinkedin;
  faGithub = faGithub;

  ngAfterViewInit(): void {
    setTimeout(() => {
      document
        .querySelectorAll('.social_icon')
        .forEach((el) => el.classList.add('show'));
    }, 500);
  }
}

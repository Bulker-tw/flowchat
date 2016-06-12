import { Component, OnInit } from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';
import {MODAL_DIRECTVES, BS_VIEW_PROVIDERS, DROPDOWN_DIRECTIVES} from 'ng2-bootstrap/ng2-bootstrap';
import {LoginService} from '../services/login.service';
import {UserService} from '../services/user.service'
import {User, Tools} from '../shared';


@Component({
  moduleId: module.id,
  selector: 'app-navbar',
  templateUrl: 'navbar.component.html',
  styleUrls: ['navbar.component.css'],
  directives: [MODAL_DIRECTVES, DROPDOWN_DIRECTIVES, CORE_DIRECTIVES],
  providers: [LoginService],
  viewProviders: [BS_VIEW_PROVIDERS]
})
export class NavbarComponent implements OnInit {

  private signup: Signup = {};
  private login: Login = {};

  constructor(private userService: UserService,
    private loginService: LoginService) {

  }

  ngOnInit() {
  }

  signupSubmit() {
    this.loginService.signup(this.signup.username, 
      this.signup.password, 
      this.signup.email).subscribe(
      user => {
        this.userService.setUser(user);
        this.userService.sendLoginEvent(user);
        console.log(this.userService.getUser());
        document.getElementById('closeModalButton').click();
      },
      error => console.log(error));

  }

  loginSubmit() {
    this.loginService.login(this.login.usernameOrEmail,
      this.login.password).subscribe(
      user => {
        this.userService.setUser(user);
        this.userService.sendLoginEvent(user);
        console.log(this.userService.getUser());
        document.getElementById('closeModalButton').click();
      },
      error => console.log(error));
  }


  
}

interface Signup {
  username?: string;
  password?: string;
  verifyPassword?: string;
  email?: string;
}

interface Login {
  usernameOrEmail?: string;
  password?: string;
}




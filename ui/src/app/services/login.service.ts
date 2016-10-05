import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import { Http, Response } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';
import {User} from '../shared';
import {UserService} from './user.service';
import {environment} from '../../environments/environment';


@Injectable()
export class LoginService {

  private getOrCreateUrl: string = environment.endpoint + 'user';
  private loginUrl: string = environment.endpoint + 'login';
  private signupUrl: string = environment.endpoint + 'signup';

  constructor(private http: Http,
    private userService: UserService) {
  }

  getOrCreateUser(): Observable<User> {
    return this.http.get(this.getOrCreateUrl, this.userService.getOptions())
      .map(r => r.json())
      .catch(this.handleError);
  }

  login(usernameOrEmail: string, password: string): Observable<User> {
    let reqBody: string = JSON.stringify({ usernameOrEmail, password });
    return this.http.post(this.loginUrl, reqBody)
      .map(r => r.json())
      .catch(this.handleError);
  }

  signup(username: string, password: string, verifyPassword: string, email: string): Observable<User> {
    let reqBody: string = JSON.stringify({ username, password, verifyPassword, email });
    return this.http.post(this.signupUrl, reqBody)
      .map(r => r.json())
      .catch(this.handleError);
  }

  private handleError(error: any) {
    // We'd also dig deeper into the error to get a better message
    let errMsg = error._body;
    return Observable.throw(errMsg);
  }

}

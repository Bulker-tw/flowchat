import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/mergeMap';
import { Http, Response } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';
import {UserService} from './user.service';
import {Comment} from '../shared/comment.interface';

@Injectable()
export class NotificationsService {

  private getUnreadUrl: string = 'http://localhost:4567/get_unread_replies';
  private markAsReadUrl: string = 'http://localhost:4567/mark_reply_as_read/';

  private fetchInterval: number = 60000;

  constructor(private http: Http,
    private userService: UserService) {
  }

  getUnreadMessages() {
    return Observable.interval(this.fetchInterval).startWith(0).flatMap(() => {
      return this.http.get(this.getUnreadUrl, this.userService.getOptions())
        .map(this.extractData)
        .catch(this.handleError);
    });
  }

  markMessageAsRead(id: number) {
    return this.http.post(this.markAsReadUrl + id, null, this.userService.getOptions())
      .map(this.extractData)
      .catch(this.handleError);
  }

  private handleError(error: any) {
    // We'd also dig deeper into the error to get a better message
    let errMsg = error.json().message;

    return Observable.throw(errMsg);
  }

  private extractData(res: Response) {
    let body = res.json();
    return body || {};
  }

}

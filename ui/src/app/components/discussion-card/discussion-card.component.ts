import { Component, OnInit, Input} from '@angular/core';
import {FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, FormGroup, FormControl} from '@angular/forms';
import {DomSanitizationService, SafeHtml} from '@angular/platform-browser';
import {Discussion} from '../../shared/discussion.interface';
import {Tag} from '../../shared/tag.interface';
import {User} from '../../shared/user.interface';
import {Tools} from '../../shared/tools';
import { MomentPipe } from '../../pipes/moment.pipe';
import {MarkdownPipe} from '../../pipes/markdown.pipe';
import {UserService} from '../../services/user.service';
import {DiscussionService} from '../../services/discussion.service';
import {TagService} from '../../services/tag.service';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import {MarkdownEditComponent} from '../markdown-edit/index';
import {TYPEAHEAD_DIRECTIVES, TOOLTIP_DIRECTIVES} from 'ng2-bootstrap/ng2-bootstrap';
import {ToasterService} from 'angular2-toaster/angular2-toaster';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';


@Component({
  moduleId: module.id,
  selector: 'app-discussion-card',
  templateUrl: 'discussion-card.component.html',
  styleUrls: ['discussion-card.component.css'],
  directives: [MarkdownEditComponent, TYPEAHEAD_DIRECTIVES, TOOLTIP_DIRECTIVES,
    ROUTER_DIRECTIVES, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES],
  pipes: [MomentPipe, MarkdownPipe]
})
export class DiscussionCardComponent implements OnInit {

  @Input() discussion: Discussion;

  private showVoteSlider: boolean = false;

  @Input() editMode: boolean = false;

  // tag searching
  private tagSearchResultsObservable: Observable<any>;
  private tagSearchSelected: string = '';
  private tooManyTagsError: boolean = false;
  private tagTypeaheadLoading: boolean = false;
  private tagTypeaheadNoResults: boolean = false;

  // For the private users
  private userSearchResultsObservable: Observable<any>;
  private userSearchSelected: string = '';
  private userTypeaheadLoading: boolean = false;
  private userTypeaheadNoResults: boolean = false;

  // Blocked users
  private blockedUserSearchResultsObservable: Observable<any>;
  private blockedUserSearchSelected: string = '';
  private blockedUserTypeaheadLoading: boolean = false;
  private blockedUserTypeaheadNoResults: boolean = false;

  constructor(private userService: UserService,
    private discussionService: DiscussionService,
    private tagService: TagService,
    private toasterService: ToasterService,
    private router: Router,
    private sanitizer: DomSanitizationService) { }

  ngOnInit() {
    this.setupTagSearch();
    this.setupUserSearch();
    this.setupBlockedUserSearch();
  }

  ngAfterViewInit() {
  }


  isCreator(): boolean {
    if (this.userService.getUser() != null) {
      return this.userService.getUser().id == this.discussion.userId;
    } else {
      return false;
    }
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

  setEditText($event) {
    this.discussion.text = $event;
  }

  saveDiscussion() {
    this.discussionService.saveDiscussion(this.discussion).subscribe(
      d => {
        this.discussion = d;
        this.editMode = false;
      });
  }

  deleteDiscussion() {
    this.discussion.deleted = true;
    this.saveDiscussion();
  }

  toggleShowVoteSlider() {
    this.showVoteSlider = !this.showVoteSlider;
  }

  updateDiscussionRank($event) {
    this.discussion.userRank = $event;
  }

  saveDiscussionRank($event) {
    this.discussion.userRank = $event;
    this.showVoteSlider = false;
    this.discussionService.saveRank(this.discussion.id, this.discussion.userRank).subscribe();
  }

  // Tag search methods
  setupTagSearch() {
    this.tagSearchResultsObservable = Observable.create((observer: any) => {
      this.tagService.searchTags(this.tagSearchSelected)
        .subscribe((result: any) => {
          observer.next(result.tags);
        });
    });
  }


  tagTypeaheadOnSelect(tag: Tag) {
    this.addTag(tag);
  }

  addTag(tag: Tag) {
    // Create the array if necessary
    if (this.discussion.tags == null) {
      this.discussion.tags = [];
    }

    // add it to the list
    if (this.discussion.tags.length < 3) {
      this.discussion.tags.push(tag);
      this.tagSearchSelected = '';
    } else {
      this.tooManyTagsError = true;
    }
  }

  tagChangeTypeaheadLoading(e: boolean): void {
    this.tagTypeaheadLoading = e;
  }

  tagChangeTypeaheadNoResults(e: boolean): void {
    this.tagTypeaheadNoResults = e;
  }

  removeTag(tag: Tag) {
    let index = this.discussion.tags.indexOf(tag);
    this.discussion.tags.splice(index, 1);
    this.tooManyTagsError = false;
  }

  createTag() {
    this.tagService.createTag(this.tagSearchSelected).subscribe(d => {
      console.log(d);
      this.tagSearchSelected = '';
      this.toasterService.pop('success', 'New Tag Created', d.name);
      this.addTag(d);
    });

  }

  // User search methods
  setupUserSearch() {
    this.userSearchResultsObservable = Observable.create((observer: any) => {
      this.userService.searchUsers(this.userSearchSelected)
        .subscribe((result: any) => {
          observer.next(result.users);
        });
    });
  }

  userTypeaheadOnSelect(user: User) {

    // Create the array if necessary
    if (this.discussion.privateUsers == null) {
      this.discussion.privateUsers = [];
    }

    // add it to the list
    this.discussion.privateUsers.push(user);
    this.userSearchSelected = '';

  }

  userChangeTypeaheadLoading(e: boolean): void {
    this.userTypeaheadLoading = e;
  }

  userChangeTypeaheadNoResults(e: boolean): void {
    this.userTypeaheadNoResults = e;
  }

  removePrivateUser(user: User) {
    let index = this.discussion.privateUsers.indexOf(user);
    this.discussion.privateUsers.splice(index, 1);
  }

  privateUsersWithoutYou() {
    return this.discussion.privateUsers.slice(1);
  }

  // Blocked user methods
  setupBlockedUserSearch() {
    this.blockedUserSearchResultsObservable = Observable.create((observer: any) => {
      this.userService.searchUsers(this.blockedUserSearchSelected)
        .subscribe((result: any) => {
          observer.next(result.users);
        });
    });
  }

  blockedUserTypeaheadOnSelect(user: User) {

    // Create the array if necessary
    if (this.discussion.blockedUsers == null) {
      this.discussion.blockedUsers = [];
    }

    // add it to the list
    this.discussion.blockedUsers.push(user);
    this.blockedUserSearchSelected = '';

  }

  blockedUserChangeTypeaheadLoading(e: boolean): void {
    this.blockedUserTypeaheadLoading = e;
  }

  blockedUserChangeTypeaheadNoResults(e: boolean): void {
    this.blockedUserTypeaheadNoResults = e;
  }

  removeBlockedUser(user: User) {
    let index = this.discussion.blockedUsers.indexOf(user);
    this.discussion.blockedUsers.splice(index, 1);
  }

  removeQuotes(text: string) {
    return text.replace(/['"]+/g, '');
  }

  parseImageThumbnail(link: string) {
    return Tools.parseImageThumbnail(link);
  }

  private getDiscussionText(): SafeHtml {
    if (this.discussion != null) {
      return this.sanitizer.bypassSecurityTrustHtml(
        new MarkdownPipe().transform(this.discussion.text));
    } else {
      return '';
    }
  }

}

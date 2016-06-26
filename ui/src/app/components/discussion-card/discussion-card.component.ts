import { Component, OnInit, Input} from '@angular/core';
import {Discussion} from '../../shared/discussion.interface';
import {Tag} from '../../shared/tag.interface';
import {User} from '../../shared/user.interface';
import { MomentPipe } from '../../pipes/moment.pipe';
import {MarkdownPipe} from '../../pipes/markdown.pipe';
import {UserService} from '../../services/user.service';
import {DiscussionService} from '../../services/discussion.service';
import {TagService} from '../../services/tag.service';
import { Router, ROUTER_DIRECTIVES } from '@angular/router-deprecated';
import {MarkdownEditComponent} from '../markdown-edit/index';
import {TYPEAHEAD_DIRECTIVES} from 'ng2-bootstrap/ng2-bootstrap';
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
  directives: [MarkdownEditComponent, ROUTER_DIRECTIVES, TYPEAHEAD_DIRECTIVES],
  pipes: [MomentPipe, MarkdownPipe]
})
export class DiscussionCardComponent implements OnInit {

  @Input() discussion: Discussion;

  private showVoteSlider: boolean = false;

  private editMode: boolean = false;

  private tagSearchTermStream = new Subject<string>();
  private tagResultsObservable: Observable<any>;
  private tagSearchResults: Array<Tag>;
  private tagSearchTerm: string = '';
  private tooManyTagsError: boolean = false;
  private tagTypeaheadLoading: boolean = false;
  private tagTypeaheadNoResults: boolean = false;

  private userSearchTermStream = new Subject<string>();
  private userResultsObservable: Observable<any>;
  private userSearchResults: Array<User>;
  private userSearchTerm: string = '';
  private userTypeaheadLoading: boolean = false;
  private userTypeaheadNoResults: boolean = false;

  constructor(private userService: UserService,
    private discussionService: DiscussionService,
    private tagService: TagService,
    private toasterService: ToasterService,
    private router: Router) { }

  ngOnInit() {
    this.setupTagSearch();
    this.setupUserSearch();
  }

  ngAfterViewInit() {
  }


  isCreator(): boolean {
    return this.userService.getUser().id == this.discussion.userId;
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
    this.tagResultsObservable = this.tagSearchTermStream
      .debounceTime(300)
      .distinctUntilChanged()
      .switchMap((term: string) => this.tagService.searchTags(term));

    this.tagResultsObservable.subscribe(t => this.tagSearchResults = t.tags);
    // this.tagSearch('a');
  }

  tagSearch(term: string) {
    if (term !== '') {
      this.tagSearchTermStream.next(term);
    }
  }

  tagTypeaheadOnSelect(tag: Tag) {

    // Create the array if necessary
    if (this.discussion.tags == null) {
      this.discussion.tags = [];
    }

    // add it to the list
    if (this.discussion.tags.length < 3) {
      this.discussion.tags.push(tag);
      this.tagSearchTerm = '';
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
    this.tagService.createTag(this.tagSearchTerm).subscribe(d => {
      console.log(d);
      this.tagSearchTerm = '';
      this.toasterService.pop('success', 'New Tag Created', d.name);
    });
    
  }

  // User search methods
  setupUserSearch() {
    this.userResultsObservable = this.userSearchTermStream
      .debounceTime(300)
      .distinctUntilChanged()
      .switchMap((term: string) => this.userService.searchUsers(term));

    this.userResultsObservable.subscribe(t => this.userSearchResults = t.users);
    // this.tagSearch('a');
  }

  userSearch(term: string) {
    if (term !== '') {
      this.userSearchTermStream.next(term);
    }
  }

  userTypeaheadOnSelect(user: User) {

    // Create the array if necessary
    if (this.discussion.privateUsers == null) {
      this.discussion.privateUsers = [];
    }

    // add it to the list
    this.discussion.privateUsers.push(user);
    this.userSearchTerm = '';

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

  removeQuotes(text: string) {
    return text.replace(/['"]+/g, '');
  }

}
